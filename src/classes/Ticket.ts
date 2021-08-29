import { Channel, Guild, Snowflake, TextChannel, User, MessageEmbed, MessageActionRow, MessageButton, Message, GuildMember, Collection, MessageAttachment } from "discord.js";
import { clientInterface, ticketOpt } from "../interfaces";
import { chatExport } from "../helpers/transcript";

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

    constructor(client : clientInterface, opt : ticketOpt) {

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

    async init() : Promise<void> {

        const client = this.client;

        this.guild = client.guilds.cache.get(this.guildId);
        this.channel = this.guild.channels.cache.get(this.channelId);

        this.ticketOwnerId = (this.channel as TextChannel).name.split("-")[1];
        this.ticketOwner = await client.users.fetch(this.ticketOwnerId);

        this.user = await client.users.fetch(this.userId);

        this.isInited = true;
    }

    async take() : Promise<void> {

        if(!this.isInited) await this.init();

        const client = this.client;
        const guild = this.guild;

        const ticketOwner = this.ticketOwner;
        const ticketClicker = this.user;

        if(!this.canTakeATicket(ticketClicker.id)) return;

        const staffObject = client.db.get("STAFF") || {};

        if(!staffObject[ticketClicker.id]) staffObject[ticketClicker.id] = 1;
        else staffObject[ticketClicker.id]++;

        client.db.set("STAFF", staffObject);

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

    async close() : Promise<void> {

        if(!this.isInited) await this.init();

        const client = this.client;
        const guild = this.guild;

        const ticketOwner = this.ticketOwner;
        const ticketClicker = this.user;

        const messageAndChannelId = client.db.get(`EXPLAIN_PROBLEM_${this.channelId}`);

        const channelFetched : Channel = await guild.channels.fetch(messageAndChannelId.channel);
        const messageFetched : Message = await (channelFetched as TextChannel).messages.fetch(messageAndChannelId.message);

        const embed : MessageEmbed = new MessageEmbed()
            .setColor("RED")
            .setDescription(`Le ticket a été fermé par <@!${ticketClicker.id}> \n \n\`🗑️ Suppprimer le ticket\` -> Pour supprimer le ticket \n\`🔓 Réouvrir le ticket\` -> Pour réouvrir le ticket`)
            .setFooter(client.config.footer, client.user.displayAvatarURL());

        const group1 : MessageActionRow = new MessageActionRow().addComponents(
            new MessageButton()
                .setCustomId(`${Date.now()}CLOSE-TICKET`)
                .setStyle("DANGER")
                .setLabel("🔒 Fermer le ticket")
                .setDisabled(true)
        );

        const group2 : MessageActionRow = new MessageActionRow().addComponents(
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

        (channelFetched as TextChannel).permissionOverwrites.edit(ticketOwner, {
            VIEW_CHANNEL: false,
            SEND_MESSAGES: false
        });

        const deleteEmbed = await (channelFetched as TextChannel).send({
            embeds: [embed],
            components: [group2]
        });

        client.db.set(`DELETE_EMBED_${this.channelId}`, deleteEmbed.id);
    }

    async prepareDelete() : Promise<void> {
        if(!this.isInited) await this.init();

        const client = this.client;

        const deleteEmbedId : Snowflake = client.db.get(`DELETE_EMBED_${this.channelId}`);
        const deleteEmbedFetched : Message = await (this.channel as TextChannel).messages.fetch(deleteEmbedId);

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

        this.delete(false);
    }

    async reopen() : Promise<void>{
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

        (this.channel as TextChannel).send(`Ticket réouvert par <@!${this.userId}>`);
    }

    canTakeATicket(userId : Snowflake) : boolean {

        let userCanTakeTicket = false;

        const guild : Guild = this.guild;
        const client : clientInterface = this.client;
        const member : GuildMember = guild.members.cache.get(userId);

        if(member.permissions.has("MANAGE_MESSAGES")) return true;

        member.roles.cache.forEach(role => {
            if(client.config.allowedRoles.includes(role.id)) return userCanTakeTicket = true;
        });

        return userCanTakeTicket;
    }

    async delete(force : boolean) : Promise<void> {
        if(!this.isInited) await this.init();

        if(!force) await this.save();

        const client = this.client;

        (this.channel as TextChannel).send(`Ce ticket va être supprimé dans **3 secondes** !`);
        setTimeout(() => this.channel.delete(), 3000);

        if(client.db.get(`EXPLAIN_PROBLEM_${this.channelId}`)) client.db.delete(`EXPLAIN_PROBLEM_${this.channelId}`);
        if(client.db.get(`PENDING_MESSAGE_${this.channelId}`)) client.db.delete(`PENDING_MESSAGE_${this.channelId}`);
        if(client.db.get(`DESCRIPTION_${this.channelId}`)) client.db.delete(`DESCRIPTION_${this.channelId}`);
        if(client.db.get(`DELETE_EMBED_${this.channelId}`)) client.db.delete(`DELETE_EMBED_${this.channelId}`);
    }

    hasAlreadyATicket(userId : Snowflake) : boolean {

        let userHasAlreadyATicket = false;

        const client = this.client;
        const guild = client.guilds.cache.get(this.guildId);

        const allTickets = guild.channels.cache.filter(channel => channel.parentId === client.config.ticketCategory);

        allTickets.forEach(channel => {
            if(channel.name.includes(userId)) userHasAlreadyATicket = true; 
        });

        return userHasAlreadyATicket;
    }

    async save() : Promise<void> {
        if(!this.isInited) await this.init();

        const channel = this.channel;
        const guild = this.guild;
        const client = this.client;

        const transcriptEmbed = new MessageEmbed()
        .setDescription("Transcription en cours...")
        .setColor("ORANGE")
        .setFooter(client.config.footer, client.user.displayAvatarURL());

        const msg = await (channel as TextChannel).send({
            embeds: [transcriptEmbed]
        });

        const messagesCollection : Collection<string, Message> = await (channel as TextChannel).messages.fetch({
            limit: 100
        });

        let messageArray =  Array.from(messagesCollection.values());
        messageArray = messageArray.sort((a, b) => b.createdTimestamp - a.createdTimestamp);

        const users = [];

        messageArray.forEach(async messageArray => {
            if (users.find(x => x.id === messageArray.member.id)) return;
            users.push(messageArray.member);
        });

        let url = null;

        await chatExport(this.channelId, this.ticketOwnerId, this.client).then(async file => {

            transcriptEmbed.setColor("GREEN")
            .setDescription("Transcription réussie !");

            await msg.edit({
                embeds: [transcriptEmbed]
            });

            url = new MessageAttachment(file, `ticket-${this.userId}-${channel.id}.html`);
        }).catch(async err => {

            client.logger.error(err);

            transcriptEmbed.setColor("RED")
            .setDescription("Transcription échouée ]:");

            await msg.edit({
                embeds: [transcriptEmbed]
            });
        });

        let usersInTicket = ``;
        await users.forEach(async member => {
            usersInTicket += `\n• ${member} (${member.user.tag})`;
        });

        const finalEmbed = new MessageEmbed()
        .setColor("BLUE")
        .setDescription(`__Ticket de:__ <@!${this.ticketOwnerId}> \n \nPersonnes ayant participés au ticket: ${usersInTicket}`)
        .setFooter(client.config.footer, client.user.displayAvatarURL());

        const transcriptChannel = guild.channels.cache.get(client.config.transcriptChannel);
        if (!transcriptChannel) return;

        if(url) await (transcriptChannel as TextChannel).send({
            files: [url],
            embeds: [finalEmbed]
        });
        else await (transcriptChannel as TextChannel).send({
            embeds: [finalEmbed]
        });
    }
}