import { Client, Event } from "../classes/Event";
import { Message, PermissionResolvable } from "discord.js";

class MessageEvent extends Event {

    constructor(client : Client) {
        super(client);
    }

    async run(message : Message) {

        const client : Client = this.client;
        const prefix : string = client.config.prefix;

        if(message.author.bot) return;

        if(message.channel.type === "DM") return;

        if(message.content === `<@!${client.user.id}>`) return message.reply(`:wave: Bonjour ${message.author}, mon prefix est \`${prefix}\` !`);
        if(!message.content.startsWith(prefix)) return;
    
        const args = message.content.slice(prefix.length).trim().split(/ +/);
        const commandName = args.shift().toLowerCase();
        const command = client.commands.get(commandName) || client.commands.get(client.aliases.get(commandName));
        if(!command) return;

        if(!command.settings.enabled) return message.reply(`:x: **Cette commande est actuellement désactivée !**`);

        if(command.settings.userPerms) {
            const neededPerms : string[] = [];
            const channel = message.channel;

            command.settings.userPerms.forEach((perm) => {
                if(!channel.permissionsFor(message.member).has(perm as PermissionResolvable) && !client.config.owners.includes(message.author.id)) neededPerms.push(perm);
            });

            if(neededPerms.length > 1) return message.reply(`:x: **Vous avez besoin des permissions:** ${neededPerms.map((p) => `\`${p}\``).join(", ")} **pour cela !**`);
            else if(neededPerms.length == 1) return message.reply(`:x: **Vous avez besoin de la permission:** ${"`" + neededPerms[0] + "`"} **pour cela !**`);
        }

        if(command.settings.restriction.includes("OWNER") && !client.config.owners.includes(message.author.id)) return message.reply(`:x: **Vous avez besoin de la permission:** \`Créateur du bot\` **pour cela !**`);

        command.run(message, args, prefix);
    }
}

module.exports = MessageEvent;