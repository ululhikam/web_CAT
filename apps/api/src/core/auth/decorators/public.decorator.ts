import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'webcat:isPublic';

/** Menandai route yang boleh diakses tanpa access token. */
export const Public = (): MethodDecorator & ClassDecorator => SetMetadata(IS_PUBLIC_KEY, true);
