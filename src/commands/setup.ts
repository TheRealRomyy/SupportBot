import { Message, MessageActionRow, MessageButton, MessageEmbed, TextChannel } from "discord.js";
import { Command, Client } from "../classes/Command";

class Setup extends Command {

    constructor(client : Client) {
        super(client, {
            name: "setup",
            cooldown: 0,
            aliases: [],
            enabled: true,
            userPerms: [],
            restriction: [ "OWNER" ],
            category: "Owner"
        });
    }

    async run(message : Message, args : string[]) {

        const client = this.client;

        if(!args[0] && !message.mentions.channels.first()) return message.reply(`:x: Vous devez faire \`${client.config.prefix}setup <channelId>\``);

        if(!client.db.get(`CREATE_BUTTON_${message.guild.id}`)) client.db.set(`CREATE_BUTTON_${message.guild.id}`, "");

        const channel = message.guild.channels.cache.get(args[0]) || message.mentions.channels.first();
        if(!channel) return message.reply(":x: Ce channel n'existe pas !");

        const buttonId = `${Date.now()}${message.channelId}${message.guildId}SETUP`;

        const embed = new MessageEmbed()
        .setDescription("Cliquez sur le boutton ci-dessous pour créer un ticket.")
        .setFooter(client.config.footer, client.user.displayAvatarURL());

        const group = new MessageActionRow().addComponents(
            new MessageButton()
            .setCustomId(buttonId)
            .setStyle("PRIMARY")
            .setLabel("🎟️ Create a ticket")
            .setDisabled(false)
        );

        (channel as TextChannel).send({
            embeds: [embed],
            components: [group]
        }).then(() => {
            client.db.set(`CREATE_BUTTON_${message.guild.id}`, buttonId);

            return message.reply(`:white_check_mark: Le nouveau message sur lequel apparaitra le bouton est dans le channel <#${channel.id}> !`);
        });
    }
}

module.exports = Setup;