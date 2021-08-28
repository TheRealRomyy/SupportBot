import { Client, Event } from "../classes/Event";
import { Interaction, MessageEmbed, MessageActionRow, MessageButton } from "discord.js";
import { Ticket } from "../classes/Ticket";

class InteractionCreate extends Event {

    constructor(client : Client) {
        super(client);
    }

    async run (button : Interaction) {

        if (!button.isButton()) return;

        const client = this.client;

        await button.deferUpdate();

        const ticket = new Ticket(client, {
            channelId: button.channelId,
            guildId: button.guildId,
            userId: button.user.id
        });

        if(button.customId === await client.db.get(`CREATE_BUTTON_${button.guildId}`)) {

            const explainProblemEmbed = new MessageEmbed()
                .setDescription(`Vous pouvez rapidement décrire votre problème ici, pour que notre équipe sache à quoi s'attendre. \n \n:warning: Vous avez 10 minutes maximum pour écrire ce message !`)
                .setColor("ORANGE")
                .setFooter(client.config.footer, client.user.displayAvatarURL());

            button.guild.channels.create("ticket-" + button.user.id).then(ticketChannel => {
                ticketChannel.setParent(client.config.ticketCategory);

                ticketChannel.send({
                    embeds: [explainProblemEmbed],
                    content: `Bienvenue <@!${button.user.id}>`
                }).then(messageInTheTicket => {

                    ticketChannel.permissionOverwrites.edit(button.user, {
                        VIEW_CHANNEL: true,
                        SEND_MESSAGES: true
                    });

                    const opt = { 
                        filter: (m) => m.author.id === button.user.id,
                        max: 1, 
                        time: 600000, 
                        errors: [ "time" ] 
                    };

                    const collector = ticketChannel.createMessageCollector(opt);

                    collector.on("collect", async msg => {
                        
                        const content = msg.content;

                        client.db.set(`DESCRIPTION_${ticketChannel.id}`, content);

                        msg.delete().catch();

                        const explainProblemEmbed2 = new MessageEmbed()
                            .setColor("BLUE")
                            .addField("Utilisateur", `<@!${button.user.id}>`, true)
                            .addField("Affecté à", "-", true)
                            .setFooter(client.config.footer, client.user.displayAvatarURL())
                            .addField("Problème de l'utilisateur", content, false)
                            .setThumbnail(button.user.displayAvatarURL());

                        const group = new MessageActionRow().addComponents(
                            new MessageButton()
                                .setCustomId(`${Date.now()}TAKE-TICKET`)
                                .setStyle("SECONDARY")
                                .setLabel("🛠️ S'occuper du ticket")
                                .setDisabled(false)
                        );

                        messageInTheTicket.edit({
                            components: [group],
                            embeds: [explainProblemEmbed2],
                            content: null
                        });

                        ticketChannel.permissionOverwrites.edit(button.user, {
                            VIEW_CHANNEL: true,
                            SEND_MESSAGES: false
                        });

                        const pendingMsg = await ticketChannel.send(`<@!${button.user.id}> Un membre du staff va prendre en charge votre requête dans les plus brefs délais.`);

                        client.db.set(`PENDING_MESSAGE_${ticketChannel.id}`, {
                            message: pendingMsg.id,
                            channel: pendingMsg.channelId
                        });

                        client.db.set(`EXPLAIN_PROBLEM_${ticketChannel.id}`, {
                            message: messageInTheTicket.id,
                            channel: messageInTheTicket.channelId
                        });
                    });

                    collector.on("end", (collected, reason) => {
                        client.db.delete(`EXPLAIN_PROBLEM_${ticketChannel.id}`);
                        if(reason === "time") ticketChannel.delete();
                        return;
                    });
                });
            });
        } else if(button.customId.includes("TAKE-TICKET")) ticket.take();
        else if(button.customId.includes("CLOSE-TICKET")) ticket.close();
        else if(button.customId.includes("DELETE-TICKET")) ticket.delete();
        else if(button.customId.includes("REOPEN-TICKET")) ticket.reopen();
        
    }
}

module.exports = InteractionCreate;