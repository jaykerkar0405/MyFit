import { z } from 'zod';
import type { PageServerLoad } from './$types';
import { createCaller } from '$lib/trpc/router';
import { createContext } from '$lib/trpc/context';
import { QuotesDisplayModeSchema } from '$lib/zodSchemas';

const QuotesDisplayModesArraySchema = z.array(QuotesDisplayModeSchema).min(1);

export const load: PageServerLoad = async (event) => {
	event.depends('settings:userSettings');
	const trpc = createCaller(await createContext(event));

	try {
		const userSettings = await trpc.users.getUserSettings();

		if (!userSettings) {
			return {
				hasError: false,
				userSettings: {
					motivationalQuotesEnabled: false,
					quotesDisplayModes: [QuotesDisplayModeSchema.Values.PRE_WORKOUT]
				}
			};
		}

		const validatedQuotesDisplayModes = QuotesDisplayModesArraySchema.safeParse(userSettings.quotesDisplayModes);

		return {
			hasError: false,
			userSettings: {
				quotesDisplayModes: validatedQuotesDisplayModes.success
					? validatedQuotesDisplayModes.data
					: [QuotesDisplayModeSchema.Values.PRE_WORKOUT],
				motivationalQuotesEnabled: Boolean(userSettings.motivationalQuotesEnabled)
			}
		};
	} catch (error) {
		console.error('Failed to load settings:', error);

		return {
			hasError: true,
			userSettings: {
				motivationalQuotesEnabled: false,
				quotesDisplayModes: [QuotesDisplayModeSchema.Values.PRE_WORKOUT]
			},
			errorMessage: error instanceof Error ? error.message : 'Failed to load settings:'
		};
	}
};
