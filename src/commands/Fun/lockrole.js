import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { successEmbed } from '../../utils/embeds.js';
import { logger } from '../../utils/logger.js';
import { handleInteractionError } from '../../utils/errorHandler.js';
import { InteractionHelper } from '../../utils/interactionHelper.js';

export default {
    data: new SlashCommandBuilder()
        .setName("lock")
        .setDescription("Verrouille des salons pour plusieurs rôles spécifiques ou pour tout le serveur")
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        // On demande du texte pour pouvoir mentionner plusieurs rôles d'un coup
        .addStringOption(option => 
            option.setName("roles")
                .setDescription("Mentionne les rôles à verrouiller (ex: @Rôle1 @Rôle2) - Laisse vide pour @everyone")
                .setRequired(false)
        ),
    category: 'Moderation',

    async execute(interaction, config, client) {
        try {
            await interaction.deferReply({ ephemeral: true });

            const guild = interaction.guild;
            const textChannels = guild.channels.cache.filter(channel => channel.isTextBased());
            
            // Liste qui va contenir tous les rôles cibles
            let rolesA_Verrouiller = [];

            // 1. On récupère la chaîne de texte entrée par l'utilisateur
            const rolesInput = interaction.options.getString('roles');

            if (!rolesInput) {
                // Si rien n'est écrit, on cible tout le serveur (@everyone)
                rolesA_Verrouiller.push(guild.roles.everyone);
            } else {
                // On extrait tous les IDs de rôles présents dans les mentions (format <&ID>)
                const matches = rolesInput.match(/\d+/g);
                
                if (matches) {
                    for (const id of matches) {
                        const role = guild.roles.cache.get(id);
                        if (role && !rolesA_Verrouiller.some(r => r.id === role.id)) {
                            rolesA_Verrouiller.push(role);
                        }
                    }
                }
            }

            // Si aucun rôle valide n'a été trouvé après l'analyse du texte
            if (rolesA_Verrouiller.length === 0) {
                const embedErreur = successEmbed("⚠️ Aucun rôle trouvé", "Je n'ai reconnu aucun rôle valide dans ton message. Assure-toi de bien les mentionner !");
                return await InteractionHelper.safeReply(interaction, { embeds: [embedErreur], ephemeral: true });
            }

            // 2. On boucle sur chaque salon textuel
            for (const [channelId, channel] of textChannels) {
                // Et pour chaque salon, on applique le verrouillage à tous les rôles de la liste
                for (const role of rolesA_Verrouiller) {
                    await channel.permissionOverwrites.edit(role, {
                        SendMessages: false,
                        AddReactions: false
                    }).catch(err => {
                        logger.error(`Impossible de verrouiller le salon ${channel.name} pour le rôle ${role.name}:`, err);
                    });
                }
            }

            // 3. Construction du message de confirmation
            const listeNoms = rolesA_Verrouiller.map(r => r.id === guild.roles.everyone.id ? "tout le serveur" : `@${r.name}`).join(', ');
            
            const embed = successEmbed(
                "🔒 Salons verrouillés", 
                `Tous les salons textuels ont été verrouillés pour : **${listeNoms}**.`
            );

            await InteractionHelper.safeReply(interaction, { embeds: [embed], ephemeral: true });
            
            logger.info(`Le serveur ${guild.name} a été verrouillé pour les rôles [${listeNoms}] par ${interaction.user.tag}`);
        } catch (error) {
            logger.error('Lock command error:', error);
            await handleInteractionError(interaction, error, {
                commandName: 'lock',
                source: 'lock_command'
            });
        }
    },
};