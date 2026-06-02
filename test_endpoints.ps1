[Diagnostics.CodeAnalysis.SuppressMessageAttribute('PSAvoidUsingPlainTextForPassword', 'ApiKey')]
param(
    [string]$BaseUrl    = "http://localhost:3000",
    [string]$ApiKey     = "dev-key",
    [switch]$SkipGemini
)

$ErrorActionPreference = "Continue"
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

$PassCount    = 0
$FailCount    = 0
$CreatedId    = $null

function Write-Result {
    param([string]$Endpoint, [string]$Status, [string]$Expected, [string]$Actual, [bool]$Passed, [string]$Details)
    $color = if ($Passed) { "Green" } else { "Red" }
    $mark  = if ($Passed) { "[PASS]" } else { "[FAIL]" }
    if ($Passed) { $script:PassCount++ } else { $script:FailCount++ }
    Write-Host "$mark $Endpoint " -NoNewline -ForegroundColor $color
    Write-Host "- Expected: $Expected, Got: $Actual " -NoNewline
    if ($Status -and $Actual -eq 0) { Write-Host "($Status)" -ForegroundColor DarkGray }
    elseif ($Details)               { Write-Host "($Details)" -ForegroundColor DarkGray }
    else                            { Write-Host "" }
}

function Test-Endpoint {
    param(
        [string]$Method,
        [string]$Path,
        [hashtable]$Headers     = @{},
        [object]$Body           = $null,
        [int[]]$ExpectedCodes   = @(200)
    )
    $Uri    = "$BaseUrl$Path"
    $params = @{ Uri = $Uri; Method = $Method; Headers = $Headers }
    if ($Body -and $Method -ne 'GET') {
        $params.Body        = ($Body | ConvertTo-Json -Compress -Depth 10)
        $params.ContentType = "application/json"
    }
    try {
        $response   = Invoke-WebRequest @params -UseBasicParsing
        $statusCode = [int]$response.StatusCode
        $statusDesc = $response.StatusDescription
        $content    = $response.Content | ConvertFrom-Json -ErrorAction SilentlyContinue
    } catch {
        if ($_.Exception.Response) {
            $statusCode = [int]$_.Exception.Response.StatusCode
            $statusDesc = $_.Exception.Response.StatusDescription
        } else {
            $statusCode = 0
            $statusDesc = $_.Exception.Message
        }
        $content = $null
    }
    $passed = $ExpectedCodes -contains $statusCode
    Write-Result -Endpoint "$Method $Path" -Status $statusDesc -Expected ($ExpectedCodes -join " or ") -Actual $statusCode -Passed $passed
    return @{ StatusCode = $statusCode; Content = $content }
}

# ─── Setup ───────────────────────────────────────────────────────────────────

Write-Host "===========================================" -ForegroundColor Cyan
Write-Host "  Recipe Hub API Endpoint Tester"           -ForegroundColor Cyan
Write-Host "  Target : $BaseUrl"                        -ForegroundColor Cyan
Write-Host "  API Key: $($ApiKey.Length) chars"         -ForegroundColor Cyan
Write-Host "===========================================`n" -ForegroundColor Cyan

$AuthHeaders  = @{ "x-api-key" = $ApiKey }
$NoKeyHeaders = @{}

# ─── 1. Health (no auth) ─────────────────────────────────────────────────────

Write-Host "--- Health ---" -ForegroundColor Yellow
Test-Endpoint -Method "GET" -Path "/health" -ExpectedCodes @(200)

# ─── 2. Auth Enforcement ─────────────────────────────────────────────────────

Write-Host "`n--- Auth Enforcement ---" -ForegroundColor Yellow
Test-Endpoint -Method "GET" -Path "/api/recipes"  -Headers $NoKeyHeaders -ExpectedCodes @(401)
Test-Endpoint -Method "GET" -Path "/api/settings" -Headers $NoKeyHeaders -ExpectedCodes @(401)
Test-Endpoint -Method "GET" -Path "/api/tags"     -Headers $NoKeyHeaders -ExpectedCodes @(401)

# ─── 3. Settings ─────────────────────────────────────────────────────────────

Write-Host "`n--- Settings ---" -ForegroundColor Yellow
$settingsResult = Test-Endpoint -Method "GET" -Path "/api/settings" -Headers $AuthHeaders
if ($settingsResult.Content -and $settingsResult.Content.preferred_unit_system) {
    Write-Host "  unit_system: $($settingsResult.Content.preferred_unit_system)" -ForegroundColor DarkGray
}

Test-Endpoint -Method "PUT" -Path "/api/settings" -Headers $AuthHeaders `
    -Body @{ preferred_unit_system = "metric"; theme = "warm" } -ExpectedCodes @(200)

Test-Endpoint -Method "PUT" -Path "/api/settings" -Headers $AuthHeaders `
    -Body @{ preferred_unit_system = "imperial"; theme = "warm" } -ExpectedCodes @(200)

# Reset to metric
Test-Endpoint -Method "PUT" -Path "/api/settings" -Headers $AuthHeaders `
    -Body @{ preferred_unit_system = "metric"; theme = "warm" } -ExpectedCodes @(200)

# ─── 4. Recipes — Empty State ────────────────────────────────────────────────

Write-Host "`n--- Recipes (empty state) ---" -ForegroundColor Yellow
$listResult = Test-Endpoint -Method "GET" -Path "/api/recipes" -Headers $AuthHeaders
if ($listResult.Content) {
    Write-Host "  Total recipes: $($listResult.Content.total)" -ForegroundColor DarkGray
}

Test-Endpoint -Method "GET" -Path "/api/recipes/nonexistent-id" -Headers $AuthHeaders -ExpectedCodes @(404)

# ─── 5. Recipe CRUD ──────────────────────────────────────────────────────────

Write-Host "`n--- Recipe CRUD ---" -ForegroundColor Yellow

$newRecipe = @{
    title       = "Test Chocolate Chip Cookies"
    description = "A classic recipe for testing"
    servings    = 24
    prep_time   = 15
    cook_time   = 12
    tags        = @("dessert", "cookies", "test")
    steps       = @("Preheat oven to 375°F.", "Mix dry ingredients.", "Add wet ingredients.", "Bake 10-12 minutes.")
    source_url  = "https://example.com/cookies"
    source_type = "manual"
    ingredients = @(
        @{ name = "all-purpose flour"; amount = 2.25; unit = "cup"; unit_system = "imperial"; notes = "sifted"; sort_order = 0 }
        @{ name = "butter";            amount = 1.0;  unit = "cup"; unit_system = "imperial"; notes = "softened"; sort_order = 1 }
        @{ name = "eggs";              amount = 2.0;  unit = "";    unit_system = "";          notes = "large"; sort_order = 2 }
        @{ name = "salt";              amount = 1.0;  unit = "tsp"; unit_system = "both";      notes = ""; sort_order = 3 }
    )
}

$createResult = Test-Endpoint -Method "POST" -Path "/api/recipes" -Headers $AuthHeaders -Body $newRecipe -ExpectedCodes @(201)
if ($createResult.Content -and $createResult.Content.id) {
    $script:CreatedId = $createResult.Content.id
    Write-Host "  Created ID: $($script:CreatedId)" -ForegroundColor DarkGray
}

# Requires title
Test-Endpoint -Method "POST" -Path "/api/recipes" -Headers $AuthHeaders -Body @{ description = "no title" } -ExpectedCodes @(400)

if ($script:CreatedId) {
    # GET single
    $getResult = Test-Endpoint -Method "GET" -Path "/api/recipes/$($script:CreatedId)" -Headers $AuthHeaders
    if ($getResult.Content) {
        Write-Host "  Fetched: '$($getResult.Content.title)'" -ForegroundColor DarkGray
        Write-Host "  Ingredients: $($getResult.Content.ingredients.Count)" -ForegroundColor DarkGray
        Write-Host "  Steps: $($getResult.Content.steps.Count)" -ForegroundColor DarkGray
    }

    # PUT update
    $updatedRecipe = $newRecipe.Clone()
    $updatedRecipe.title    = "Updated Chocolate Chip Cookies"
    $updatedRecipe.servings = 12
    Test-Endpoint -Method "PUT" -Path "/api/recipes/$($script:CreatedId)" -Headers $AuthHeaders -Body $updatedRecipe -ExpectedCodes @(200)

    # Verify update
    $getUpdated = Test-Endpoint -Method "GET" -Path "/api/recipes/$($script:CreatedId)" -Headers $AuthHeaders
    if ($getUpdated.Content -and $getUpdated.Content.servings -eq 12) {
        Write-Host "  [PASS] Servings correctly updated to 12" -ForegroundColor Green
        $script:PassCount++
    } else {
        Write-Host "  [FAIL] Servings not updated" -ForegroundColor Red
        $script:FailCount++
    }

    # PUT 404
    Test-Endpoint -Method "PUT" -Path "/api/recipes/bad-id" -Headers $AuthHeaders -Body @{ title = "x" } -ExpectedCodes @(404)
}

# ─── 6. Search & Filter ──────────────────────────────────────────────────────

Write-Host "`n--- Search & Filter ---" -ForegroundColor Yellow
$searchResult = Test-Endpoint -Method "GET" -Path "/api/recipes?q=Chocolate" -Headers $AuthHeaders
if ($searchResult.Content) {
    Write-Host "  Search 'Chocolate': $($searchResult.Content.total) result(s)" -ForegroundColor DarkGray
}
Test-Endpoint -Method "GET" -Path "/api/recipes?q=xyznotfound123" -Headers $AuthHeaders
Test-Endpoint -Method "GET" -Path "/api/recipes?tag=dessert"      -Headers $AuthHeaders
Test-Endpoint -Method "GET" -Path "/api/recipes?limit=5&offset=0"  -Headers $AuthHeaders

# ─── 7. Tags ─────────────────────────────────────────────────────────────────

Write-Host "`n--- Tags ---" -ForegroundColor Yellow
$tagsResult = Test-Endpoint -Method "GET" -Path "/api/tags" -Headers $AuthHeaders
if ($tagsResult.Content -and $tagsResult.Content.tags) {
    Write-Host "  Tag count: $($tagsResult.Content.tags.Count)" -ForegroundColor DarkGray
    foreach ($t in $tagsResult.Content.tags) {
        Write-Host "    - $($t.tag) ($($t.count))" -ForegroundColor DarkGray
    }
}

# ─── 8. Image Endpoint ───────────────────────────────────────────────────────

Write-Host "`n--- Image Endpoint ---" -ForegroundColor Yellow
if ($script:CreatedId) {
    # Recipe has no image — expect 404
    Test-Endpoint -Method "GET" -Path "/api/recipes/$($script:CreatedId)/image" -Headers $AuthHeaders -ExpectedCodes @(404)
}
# No auth
Test-Endpoint -Method "GET" -Path "/api/recipes/any-id/image" -Headers $NoKeyHeaders -ExpectedCodes @(401)

# ─── 9. Ingest Validation ────────────────────────────────────────────────────

Write-Host "`n--- Ingest Validation ---" -ForegroundColor Yellow
# Missing fields
Test-Endpoint -Method "POST" -Path "/api/ingest/url"  -Headers $AuthHeaders -Body @{} -ExpectedCodes @(400)
Test-Endpoint -Method "POST" -Path "/api/ingest/text" -Headers $AuthHeaders -Body @{} -ExpectedCodes @(400)
# No auth
Test-Endpoint -Method "POST" -Path "/api/ingest/url"  -Headers $NoKeyHeaders -Body @{ url = "https://example.com" } -ExpectedCodes @(401)

# ─── 9b. Gemini Live Extraction ──────────────────────────────────────────────

if ($SkipGemini) {
    Write-Host "`n--- Gemini Live Tests --- [SKIPPED] (-SkipGemini)" -ForegroundColor Yellow
} else {
    Write-Host "`n--- Gemini Live Extraction ---" -ForegroundColor Yellow
    Write-Host "  (pass -SkipGemini to skip these)" -ForegroundColor DarkGray

    # URL extraction — expects Gemini to return structured recipe
    $urlResult = Test-Endpoint -Method "POST" -Path "/api/ingest/url" -Headers $AuthHeaders `
        -Body @{ url = "https://www.allrecipes.com/recipe/10813/best-chocolate-chip-cookies/"; preferredUnit = "metric" } `
        -ExpectedCodes @(200)

    if ($urlResult.Content) {
        $draft = $urlResult.Content
        Write-Host "  Title     : $($draft.title)" -ForegroundColor DarkGray
        Write-Host "  Servings  : $($draft.servings)" -ForegroundColor DarkGray
        Write-Host "  Ingredients: $($draft.ingredients.Count)" -ForegroundColor DarkGray

        # Verify no solid ingredient came back as ml (cups->ml conversion bug)
        $mlSolids = $draft.ingredients | Where-Object { $_.unit -eq 'ml' -and $_.name -match 'flour|sugar|butter|oat|chocolate' }
        if ($mlSolids) {
            Write-Host "  [FAIL] Solid ingredients incorrectly converted to ml:" -ForegroundColor Red
            $mlSolids | ForEach-Object { Write-Host "    - $($_.amount) ml $($_.name)" -ForegroundColor Red }
            $script:FailCount++
        } else {
            Write-Host "  [PASS] No solid ingredients as ml" -ForegroundColor Green
            $script:PassCount++
        }

        # Verify flour/sugar/butter came back in g (metric preferred)
        $weightIngs = $draft.ingredients | Where-Object { $_.unit -eq 'g' }
        if ($weightIngs.Count -gt 0) {
            Write-Host "  [PASS] Weight ingredients in g: $($weightIngs | ForEach-Object { "$($_.amount)g $($_.name)" } | Select-Object -First 3)" -ForegroundColor Green
            $script:PassCount++
        } else {
            Write-Host "  [WARN] No ingredients in grams — check unit conversion" -ForegroundColor Yellow
        }

        # Show all ingredients for manual inspection
        Write-Host "  Ingredient list:" -ForegroundColor DarkGray
        $draft.ingredients | ForEach-Object {
            $amt = if ($_.amount) { $_.amount } else { '?' }
            Write-Host "    $amt $($_.unit) $($_.name)" -ForegroundColor DarkGray
        }
    }

    # Text extraction — paste raw recipe text
    $pasteText = "Classic Shortbread`nMakes 24 biscuits`n250g plain flour`n125g butter, cold and cubed`n55g icing sugar`npinch of salt`n1. Preheat oven to 160C.`n2. Rub butter into flour until mixture resembles breadcrumbs.`n3. Stir in icing sugar and salt.`n4. Knead into a dough and roll to 1cm thick.`n5. Cut into fingers and bake for 20-25 minutes until pale golden."

    $textResult = Test-Endpoint -Method "POST" -Path "/api/ingest/text" -Headers $AuthHeaders `
        -Body @{ text = $pasteText; preferredUnit = "metric" } `
        -ExpectedCodes @(200)

    if ($textResult.Content) {
        $td = $textResult.Content
        Write-Host "  Paste title: $($td.title)" -ForegroundColor DarkGray
        Write-Host "  Paste ingredients: $($td.ingredients.Count)" -ForegroundColor DarkGray
        $td.ingredients | ForEach-Object {
            Write-Host "    $($_.amount) $($_.unit) $($_.name)" -ForegroundColor DarkGray
        }
        if ($td.ingredients.Count -gt 0) { $script:PassCount++ } else { $script:FailCount++ }
    }
}

# ─── 10. Ingest Confirm ──────────────────────────────────────────────────────

Write-Host "`n--- Ingest Confirm ---" -ForegroundColor Yellow
$confirmDraft = @{
    title       = "Confirmed Test Recipe"
    description = "Added via ingest/confirm"
    servings    = 4
    prep_time   = 10
    cook_time   = 20
    tags        = @("test", "confirmed")
    steps       = @("Step one.", "Step two.")
    source_type = "text"
    ingredients = @(
        @{ name = "water"; amount = 500.0; unit = "ml"; unit_system = "metric"; notes = ""; sort_order = 0 }
    )
}
$confirmResult = Test-Endpoint -Method "POST" -Path "/api/ingest/confirm" -Headers $AuthHeaders -Body $confirmDraft -ExpectedCodes @(201)
$confirmedId = $null
if ($confirmResult.Content -and $confirmResult.Content.id) {
    $confirmedId = $confirmResult.Content.id
    Write-Host "  Confirm created ID: $confirmedId" -ForegroundColor DarkGray
}

# Missing title
Test-Endpoint -Method "POST" -Path "/api/ingest/confirm" -Headers $AuthHeaders -Body @{ description = "no title" } -ExpectedCodes @(400)

# ─── 11. Cleanup — Delete test recipes ───────────────────────────────────────

Write-Host "`n--- Cleanup ---" -ForegroundColor Yellow
if ($script:CreatedId) {
    Test-Endpoint -Method "DELETE" -Path "/api/recipes/$($script:CreatedId)" -Headers $AuthHeaders -ExpectedCodes @(200)
    Test-Endpoint -Method "GET"    -Path "/api/recipes/$($script:CreatedId)" -Headers $AuthHeaders -ExpectedCodes @(404)
    Write-Host "  Verified cascade delete (GET → 404)" -ForegroundColor DarkGray
}
if ($confirmedId) {
    Test-Endpoint -Method "DELETE" -Path "/api/recipes/$confirmedId" -Headers $AuthHeaders -ExpectedCodes @(200)
}
# 404 on already deleted
if ($script:CreatedId) {
    Test-Endpoint -Method "DELETE" -Path "/api/recipes/$($script:CreatedId)" -Headers $AuthHeaders -ExpectedCodes @(404)
}

# ─── Summary ─────────────────────────────────────────────────────────────────

Write-Host "`n===========================================" -ForegroundColor Cyan
$total = $script:PassCount + $script:FailCount
Write-Host "  Results: $($script:PassCount)/$total passed" -ForegroundColor $(if ($script:FailCount -eq 0) { "Green" } else { "Yellow" })
if ($script:FailCount -gt 0) {
    Write-Host "  FAILURES: $($script:FailCount)" -ForegroundColor Red
} else {
    Write-Host "  All tests passed!" -ForegroundColor Green
}
Write-Host "===========================================" -ForegroundColor Cyan
