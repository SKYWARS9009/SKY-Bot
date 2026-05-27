const { ApplicationCommandOptionType, ChannelType } = require('discord.js');

module.exports = {
    name: 'say',
    description: 'Fait parler le bot dans un salon spécifique',
    options: [
        {
            name: 'texte',
            description: 'Le message que le bot doit envoyer',
            type: ApplicationCommandOptionType.String,
            required: true,
        },
        {
            name: 'salon',
            description: 'Le salon où envoyer le message',
            type: ApplicationCommandOptionType.Channel,
            required: true,
            channelTypes: [ChannelType.GuildText], // Uniquement les salons textuels
        }
    ],

    // C'est cette fonction qui s'exécute quand on tape la commande
    run: async (client, interaction) => {
        const texte = interaction.options.getString('texte');
        const salon = interaction.options.getChannel('salon');

        try {
            // Le bot envoie le message dans le salon choisi
            await salon.send(texte);

            // Confirmation invisible pour les autres
            await interaction.reply({ 
                content: `Message envoyé avec succès dans ${salon} !`, 
                ephemeral: true 
            });
        } catch (error) {
            console.error(error);
            await interaction.reply({ 
                content: "Je n'ai pas pu envoyer le message. Vérifie mes permissions dans ce salon !", 
                ephemeral: true 
            });
        }
    },
};