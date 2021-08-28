import { Message } from "discord.js";
import { Client } from "./classes/Command";
import { Client as DiscordClient, Collection } from "discord.js";
import { Logger } from "./helpers/logger";
import Enmap from "enmap";

interface configObject {
    token: string,
    prefix: string,
    footer: string,
    ticketCategory: string,
    owners: string[]
}

interface cmdFile {
    cmd: commandInterface,
    client: Client,
    settings: settingsInterface,
    help: helpInterface,
    run: (message : Message, args : string[], prefix : string) => Record<string, unknown>
}

interface settingsInterface {
    enabled: boolean,
    userPerms: string[],
    cooldown: number,
    restriction: string[]
}

interface helpInterface {
    name: string,
    category: string,
    aliases: string[]
}

interface commandInterface {
    name: string,
    aliases: string[],
    category: string,
    enabled: boolean,
    userPerms: string[],
    cooldown: number,
    restriction: string[],
}

interface clientInterface extends DiscordClient {
	config: configObject,
	logger: Logger,
    db: Enmap,
	aliases: Collection<string, string>,
	commands: Collection<string, cmdFile>,
}

export { configObject, cmdFile, commandInterface, settingsInterface, helpInterface, clientInterface };