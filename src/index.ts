import { Client, Collection, Snowflake } from "discord.js";
import { configObject, cmdFile } from "./interfaces.js";
import { readdirSync } from "fs";
import { sep } from "path";
import Enmap from "enmap";
import * as config from "../config.json";
import { Logger } from "./helpers/logger";

class SupportBot extends Client {

    public readonly config : configObject;
    public readonly db : Enmap;
    public readonly logger : Logger;

    public readonly aliases = new Collection<string, string>();
    public readonly commands = new Collection<string, cmdFile>();
    public readonly pendingTickets = new Collection<Snowflake, Date>();

    constructor() {
        super({
            intents: 32767,
            partials: [ "REACTION", "MESSAGE", "CHANNEL", "GUILD_MEMBER", "USER" ],
        });

        this.config = config;

        this.aliases = new Collection();
        this.commands = new Collection();

        this.logger = new Logger();
        this.db = new Enmap({
            name: "db"
        });
    }

    async init() : Promise<void> {

        // Load events
        const events : string[] = readdirSync("dist/src/events").filter(file => file.endsWith(".js"));
        events.forEach(file => {
            const eventName : string = file.split(".")[0];
            const event = new (require(`${__dirname}${sep}events${sep}${file}`))(this);
            this.logger.log(`Event: '${eventName}' was successfully loaded !`);
            this.on(eventName, (...args) => event.run(...args));
        });

        // Load commands
        const commandFile : string[] = readdirSync("dist/src/commands").filter(file => file.endsWith(".js"));
        commandFile.forEach(file => {
            const commandName : string = file.split(".")[0];
            try {
                const command = new (require(`${__dirname}${sep}commands${sep}${commandName}`))(this);
                this.logger.log(`Command: '${commandName}' (${command.help.category}) was successfully loaded !`);
                this.commands.set(command.help.name, command);
                for(const alias of command.help.aliases) {
                    this.aliases.set(alias, command.help.name);
                }
            } catch (e) {
                return this.logger.error(`Command: '${commandName}' can't be load: ${e}`);
            }
        });

        // Login to discord
        this.login(this.config.token);
    }
}

const client = new SupportBot();
client.init();