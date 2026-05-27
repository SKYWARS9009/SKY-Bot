import { SlashCommandBuilder, ApplicationCommandOptionType, ChannelType } from 'discord.js';
import { successEmbed } from '../../utils/embeds.js';
import { logger } from '../../utils/logger.js';
import { handleInteractionError } from '../../utils/errorHandler.js';
import { InteractionHelper } from '../../utils/interactionHelper.js';

export default {
    data: new SlashCommandBuilder()
        .setName("say")
        .setDescription("Fait parler le bot dans un salon spécifique")
        .addStringOption(option =>
            option.setName("texte")
                .setDescription("Le message que le bot doit envoyer")
                .setRequired(true)
        )
        .addChannelOption(option =>
            option.setName("salon")
                .setDescription("Le salon où envoyer le message")
                .setRequired(true)
                .addChannelTypes(ChannelType.GuildText) // Uniquement les salons textuels
        ),
    category: 'Fun',

    async execute(interaction, config, client) {
        try {
            // 1. On récupère le texte et le salon choisis par l'utilisateur
            const texte = interaction.options.getString('texte');
            const salon = interaction.options.getChannel('salon');

            // 2. Le bot envoie le message directement dans le salon cible
            await salon.send(texte);

            // 3. On génère un embed de succès pour te confirmer que c'est envoyé
            const embed = successEmbed("Message envoyé !", `Mon message a bien été posté dans le salon ${salon}.`);

            // 4. On répond de manière éphémère (il n'y a que toi qui vois la confirmation)
            await InteractionHelper.safeReply(interaction, { embeds: [embed], ephemeral: true });
            
            logger.debug(`Say command executed by user ${interaction.user.id} in guild ${interaction.guildId}`);
        } catch (error) {
            logger.error('Say command error:', error);
            await handleInteractionError(interaction, error, {
                commandName: 'say',
                source: 'say_command'
            });
        }
    },
};
