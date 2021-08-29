import { Message } from "discord.js";
import { Command, Client } from "../classes/Command";
import { Ticket } from "../classes/Ticket";

class Save extends Command {

    constructor(client : Client) {
        super(client, {
            name: "save",
            cooldown: 0,
            aliases: ["fe"],
            enabled: true,
            userPerms: [ "MANAGE_CHANNELS" ],
            restriction: [],
            category: "Owner"
        });
    }

    async run(message : Message) {

        const client : Client = this.client;
        const channel = message.guild.channels.cache.get(message.channelId);
        
        if(!channel.name.includes("ticket") || channel.name.includes("log")) return message.reply(`:x: **Ce salon n'est pas un ticket !**`);

        const ticket = new Ticket(client, {
            channelId: message.channelId,
            guildId: message.guildId,
            userId: message.author.id
        });

        ticket.save();
    }
}

module.exports = Save;