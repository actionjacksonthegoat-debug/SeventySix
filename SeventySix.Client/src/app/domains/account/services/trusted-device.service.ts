/**
 * Service for managing trusted devices (Remember This Device).
 * Domain-scoped service - must be provided in route providers.
 */

import {
	inject,
	Injectable
} from "@angular/core";
import { TrustedDeviceDto } from "@shared/models";
import { ApiService } from "@shared/services/api.service";
import { Observable } from "rxjs";

@Injectable()
export class TrustedDeviceService
{
	private readonly apiService: ApiService =
		inject(ApiService);

	private readonly endpoint: string = "auth/trusted-devices";

	/**
	 * Gets the user's trusted devices.
	 *
	 * @returns {Observable<TrustedDeviceDto[]>}
	 * List of trusted devices.
	 */
	getDevices(): Observable<TrustedDeviceDto[]>
	{
		return this
			.apiService
			.get<TrustedDeviceDto[]>(this.endpoint);
	}

	/**
	 * Revokes a specific trusted device.
	 *
	 * @param {number} deviceId
	 * The device ID to revoke.
	 *
	 * @returns {Observable<void>}
	 * Completes when the device is revoked.
	 */
	revokeDevice(deviceId: number): Observable<void>
	{
		return this
			.apiService
			.delete<void>(`${this.endpoint}/${deviceId}`);
	}

	/**
	 * Revokes all trusted devices for the current user.
	 *
	 * @returns {Observable<void>}
	 * Completes when all devices are revoked.
	 */
	revokeAllDevices(): Observable<void>
	{
		return this
			.apiService
			.delete<void>(this.endpoint);
	}
}
