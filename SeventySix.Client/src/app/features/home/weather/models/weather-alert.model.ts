/**
 * Government weather alert information
 * National weather alerts from major weather agencies
 */
export interface WeatherAlert
{
	/**
	 * Sender name of the alert
	 */
	sender_name: string;

	/**
	 * Alert event name
	 */
	event: string;

	/**
	 * Alert start time (Unix UTC timestamp)
	 */
	start: number;

	/**
	 * Alert end time (Unix UTC timestamp)
	 */
	end: number;

	/**
	 * Alert description
	 */
	description: string;

	/**
	 * Tags associated with the alert
	 */
	tags: string[];
}
