import { env } from "../env.js";
import { providerResult } from "./providerResult.js";
import { phoneLinkMessages } from "../adapters/phoneLinkProvider.stub.js";
export async function getMessages() {
    if (env.messagesProvider !== "phonelink")
        return providerResult("empty", [], "Messages provider disabled");
    try {
        const data = await phoneLinkMessages();
        return providerResult(data.length ? "ok" : "empty", data);
    }
    catch (error) {
        return providerResult("error", [], error instanceof Error ? error.message : "Messages unavailable", "messages");
    }
}
