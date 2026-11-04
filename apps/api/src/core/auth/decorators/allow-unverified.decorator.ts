import { SetMetadata } from '@nestjs/common';

export const ALLOW_UNVERIFIED_KEY = 'webcat:allowUnverified';

/**
 * Route yang tetap boleh diakses walau email belum terverifikasi
 * (mis. kirim ulang OTP, logout, lihat profil sendiri).
 */
export const AllowUnverifiedEmail = (): MethodDecorator & ClassDecorator =>
  SetMetadata(ALLOW_UNVERIFIED_KEY, true);
