import { Message } from "discord.js";
import { Command, Client } from "../classes/Command";

class ForceDelete extends Command {

    constructor(client : Client) {
        super(client, {
            name: "force-delete",
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

        if(client.db.get(`EXPLAIN_PROBLEM_${channel.id}`)) client.db.delete(`EXPLAIN_PROBLEM_${channel.id}`);
        if(client.db.get(`PENDING_MESSAGE_${channel.id}`)) client.db.delete(`PENDING_MESSAGE_${channel.id}`);
        if(client.db.get(`DESCRITPION_${channel.id}`)) client.db.delete(`DESCRITPION_${channel.id}`);
        if(client.db.get(`DELETE_EMBED_${channel.id}`)) client.db.delete(`DELETE_EMBED_${channel.id}`);

        message.reply(`Ce ticket va être supprimé dans **3 secondes** !`);

        setTimeout(() => channel.delete(), 3000);
    }
}

module.exports = ForceDelete;