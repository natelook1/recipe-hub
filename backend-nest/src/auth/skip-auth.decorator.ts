import { SetMetadata } from '@nestjs/common';
import { SKIP_AUTH } from './auth.guard';

export const SkipAuth = () => SetMetadata(SKIP_AUTH, true);
