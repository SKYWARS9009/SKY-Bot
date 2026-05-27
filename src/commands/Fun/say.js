import { SlashCommandBuilder, ChannelType, PermissionFlagsBits } from 'discord.js';
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
                .addChannelTypes(ChannelType.GuildText)
        )
        // Optionnel : Restreint la commande aux admins pour éviter le spam
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
    category: 'Fun',

    async execute(interaction, config, client) {
        try {
            const texte = interaction.options.getString('texte');
            const salon = interaction.options.getChannel('salon');

            // Envoi du message dans le salon ciblé
            await salon.send({ content: texte });

            // Préparation de l'embed de succès pour l'utilisateur
            const embed = successEmbed("Message envoyé !", `Mon message a bien été posté dans le salon ${salon}.`);

            // Réponse éphémère (invisible pour les autres membres)
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
