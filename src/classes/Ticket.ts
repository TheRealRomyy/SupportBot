import { Channel, Guild, Snowflake, TextChannel, User, MessageEmbed, MessageActionRow, MessageButton } from "discord.js";
import { clientInterface } from "../interfaces";

export class Ticket {

    public readonly channelId: Snowflake;
    public readonly guildId: Snowflake;

    public guild: Guild;
    public channel: Channel;

    public ticketOwnerId: Snowflake;
    public ticketOwner: User;

    public userId: Snowflake;
    public user: User;

    public isInited: boolean;
    public readonly client: clientInterface;

    constructor(client, opt) {

        if(!client) throw new Error("Client is a required settings !");
        if(!opt || !opt.channelId || !opt.guildId || !opt.userId) throw new Error("Opt is a required settings");

        this.channelId = opt.channelId;
        this.guildId = opt.guildId;

        this.guild = null;
        this.channel = null;

        this.ticketOwnerId = null;
        this.ticketOwner = null;

        this.userId = opt.userId;
        this.user = null;

        this.isInited = false;
        this.client = client;
    }

    async init() {

        const client = this.client;

        this.guild = client.guilds.cache.get(this.guildId);
        this.channel = this.guild.channels.cache.get(this.channelId);

        this.ticketOwnerId = (this.channel as TextChannel).name.split("-")[1];
        this.ticketOwner = await client.users.fetch(this.ticketOwnerId);

        this.user = await client.users.fetch(this.userId);

        this.isInited = true;
    }

    async take() {

        if(!this.isInited) await this.init();

        const client = this.client;
        const guild = this.guild;

        const ticketOwner = this.ticketOwner;
        const ticketClicker = this.user;

        if(!guild.members.cache.get(ticketClicker.id).permissions.has("MANAGE_MESSAGES")) return;

        const messageAndChannelId = client.db.get(`EXPLAIN_PROBLEM_${this.channelId}`);

        const channelFetched = await guild.channels.fetch(messageAndChannelId.channel);
        const messageFetched = await (channelFetched as TextChannel).messages.fetch(messageAndChannelId.message);

        const description : string = client.db.get(`DESCRIPTION_${this.channelId}`);

        const embed = new MessageEmbed()
            .setThumbnail(ticketOwner.displayAvatarURL())
            .setColor("GREEN")
            .addField("Utilisateur", `<@!${ticketOwner.id}> `, true)
            .addField("Affecté à", `${ticketClicker.username}`, true)
            .addField("Problème de l'utilisateur", `${description}`, false)
            .setFooter(client.config.footer, client.user.displayAvatarURL());

        const group1 = new MessageActionRow().addComponents(
            new MessageButton()
                .setCustomId(`${Date.now()}CLOSE-TICKET`)
                .setStyle("DANGER")
                .setLabel("🔒 Fermer le ticket")
                .setDisabled(false)
        );

        messageFetched.edit({
            embeds: [embed],
            components: [group1]
        });

        channelFetched.permissionOverwrites.edit(ticketOwner, {
            VIEW_CHANNEL: true,
            SEND_MESSAGES: true
        });

        const messageAndChannel = client.db.get(`PENDING_MESSAGE_${this.channelId}`);

        const channelFetched1 = client.channels.cache.get(messageAndChannel.channel);
        const messageFetched1 = await (channelFetched1 as TextChannel).messages.fetch(messageAndChannel.message);

        messageFetched1.delete().catch();
    }

    async close() {

        if(!this.isInited) await this.init();

        const client = this.client;
        const guild = this.guild;

        const ticketOwner = this.ticketOwner;
        const ticketClicker = this.user;

        const messageAndChannelId = client.db.get(`EXPLAIN_PROBLEM_${this.channelId}`);

        const channelFetched = await guild.channels.fetch(messageAndChannelId.channel);
        const messageFetched = await (channelFetched as TextChannel).messages.fetch(messageAndChannelId.message);

        const embed = new MessageEmbed()
            .setColor("RED")
            .setDescription(`Le ticket a été fermé par <@!${ticketClicker.id}> \n \n\`🗑️ Suppprimer le ticket\` -> Pour supprimer le ticket \n\`🔓 Réouvrir le ticket\` -> Pour réouvrir le ticket`)
            .setFooter(client.config.footer, client.user.displayAvatarURL());

        const group1 = new MessageActionRow().addComponents(
            new MessageButton()
                .setCustomId(`${Date.now()}CLOSE-TICKET`)
                .setStyle("DANGER")
                .setLabel("🔒 Fermer le ticket")
                .setDisabled(true)
        );

        const group2 = new MessageActionRow().addComponents(
            new MessageButton()
                .setCustomId(`${Date.now()}DELETE-TICKET`)
                .setStyle("DANGER")
                .setLabel("🗑️ Supprimer le ticket")
                .setDisabled(false),
            new MessageButton()
                .setCustomId(`${Date.now()}REOPEN-TICKET`)
                .setStyle("SUCCESS")
                .setLabel("🔓 Réouvrir le ticket")
                .setDisabled(false),
        );

        messageFetched.edit({
            components: [group1]
        });

        channelFetched.permissionOverwrites.edit(ticketOwner, {
            VIEW_CHANNEL: false,
            SEND_MESSAGES: false
        });

        const deleteEmbed = await (channelFetched as TextChannel).send({
            embeds: [embed],
            components: [group2]
        });

        client.db.set(`DELETE_EMBED_${this.channelId}`, deleteEmbed.id);
    }

    async delete() {
        if(!this.isInited) await this.init();

        const client = this.client;

        const deleteEmbedId = client.db.get(`DELETE_EMBED_${this.channelId}`);
        const deleteEmbedFetched = await (this.channel as TextChannel).messages.fetch(deleteEmbedId);

        const group3 = new MessageActionRow().addComponents(
            new MessageButton()
                .setCustomId(`${Date.now()}DELETE-TICKET`)
                .setStyle("DANGER")
                .setLabel("🗑️ Supprimer le ticket")
                .setDisabled(true),
            new MessageButton()
                .setCustomId(`${Date.now()}REOPEN-TICKET`)
                .setStyle("SUCCESS")
                .setLabel("🔓 Réouvrir le ticket")
                .setDisabled(true),
        );

        deleteEmbedFetched.edit({
            components: [group3]
        });

        (this.channel as TextChannel).send(`Ce ticket va être supprimé dans **3 secondes** !`);
        setTimeout(() => this.channel.delete(), 3000);

        if(client.db.get(`EXPLAIN_PROBLEM_${this.channelId}`)) client.db.delete(`EXPLAIN_PROBLEM_${this.channelId}`);
        if(client.db.get(`PENDING_MESSAGE_${this.channelId}`)) client.db.delete(`PENDING_MESSAGE_${this.channelId}`);
        if(client.db.get(`DESCRITPION_${this.channelId}`)) client.db.delete(`DESCRITPION_${this.channelId}`);
        if(client.db.get(`DELETE_EMBED_${this.channelId}`)) client.db.delete(`DELETE_EMBED_${this.channelId}`);
    }

    async reopen() {
        if(!this.isInited) await this.init();

        const client = this.client;

        const guild = this.guild;
        const ticketOwner = this.ticketOwner;

        const deleteEmbedId = client.db.get(`DELETE_EMBED_${this.channelId}`);
        const deleteEmbedFetched = await (this.channel as TextChannel).messages.fetch(deleteEmbedId);

        const messageAndChannelId = client.db.get(`EXPLAIN_PROBLEM_${this.channelId}`);
        const channelFetched = await guild.channels.fetch(messageAndChannelId.channel);
        const messageFetched = await (channelFetched as TextChannel).messages.fetch(messageAndChannelId.message);

        const group4 = new MessageActionRow().addComponents(
            new MessageButton()
                .setCustomId(`${Date.now()}CLOSE-TICKET`)
                .setStyle("DANGER")
                .setLabel("🔒 Fermer le ticket")
                .setDisabled(false)
        );

        const group5 = new MessageActionRow().addComponents(
            new MessageButton()
                .setCustomId(`${Date.now()}DELETE-TICKET`)
                .setStyle("DANGER")
                .setLabel("🗑️ Supprimer le ticket")
                .setDisabled(true),
            new MessageButton()
                .setCustomId(`${Date.now()}REOPEN-TICKET`)
                .setStyle("SUCCESS")
                .setLabel("🔓 Réouvrir le ticket")
                .setDisabled(true),
        );

        deleteEmbedFetched.edit({
            components: [group5]
        });

        messageFetched.edit({
            components: [group4]
        });

        channelFetched.permissionOverwrites.edit(ticketOwner, {
            VIEW_CHANNEL: true,
            SEND_MESSAGES: true
        });

        (this.channel as TextChannel).send(`Ticket réouvert par <@!${this.userId}`);
    }
}