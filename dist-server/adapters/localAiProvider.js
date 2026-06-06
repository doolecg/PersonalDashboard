import { llamaCppOpenAiProvider } from "./llamaCppOpenAiProvider.js";
export const localAiProvider = {
    ...llamaCppOpenAiProvider,
    name: "localai"
};
