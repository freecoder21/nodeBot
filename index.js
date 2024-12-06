const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
const dotenv = require('dotenv');
const axios = require('axios'); // Ensure axios is imported

dotenv.config();

const TOKEN = process.env.BOT_TOKEN;
const CHANNEL_ID = process.env.CHANNEL_ID;
const CHANNEL_INVITE_LINK = process.env.CHANNEL_INVITE_LINK;
const PORT = process.env.PORT || 3000;
const WEBHOOK_URL = process.env.WEBHOOK_URL; // Ensure this is set in your .env file

const bot = new TelegramBot(TOKEN);
const app = express();

// A dictionary to store user data. Each user will have their own entry with specific details.
const userData = {};

const subscribeButton = { text: "S'abonner 📢" };
const button1 = { text: "Inviter 🧑‍🤝‍🧑" };
const button2 = { text: "Solde 💲" };
const button3 = { text: "Retirer 💳" };
const button4 = { text: "Bonus 💰" };
const button5 = { text: "paramètre ⚡⚙️" };
const button6 = { text: "🤷comment ça marche💡" };

const subscribKeyboard = {
  keyboard: [[subscribeButton]],
  resize_keyboard: true
};

const keyboard1 = {
  keyboard: [
    [button1, button2],
    [button3, button4, button5],
    [button6]
  ],
  resize_keyboard: true
};

// Handle the "/start" command when a user starts the bot
bot.onText(/\/start/, async (msg, match) => {
  const userId = msg.from.id;
  const inviterId = match.input.split(' ')[1] ? parseInt(match.input.split(' ')[1]) : null;

  try {
    const member = await bot.getChatMember(CHANNEL_ID, userId);
    const isMember = ['member', 'administrator', 'creator'].includes(member.status);

    if (!isMember) {
      await bot.sendMessage(userId, `❗ Vous devez rejoindre notre canal avant d'utiliser le bot.\n\n🔗 [Cliquez ici pour rejoindre notre canal](${CHANNEL_INVITE_LINK})`, {
        parse_mode: 'Markdown',
        reply_markup: subscribKeyboard
      });
      return;
    } else {
      await bot.sendMessage(userId, `🎉 Bienvenue dans le canal !\nMerci de nous rejoindre, profitez de nos services.`, {
        reply_markup: keyboard1
      });
    }
  } catch (error) {
    console.error('Error checking chat member:', error);
    await bot.sendMessage(userId, "❗ Impossible de vérifier l'adhésion au canal. Veuillez réessayer plus tard.");
    return;
  }

  if (!userData[userId]) {
    userData[userId] = {
      name: msg.from.first_name,
      invite: 0,
      sold: 0,
      phone: '',
      Bonus: 0,
      subscribed: true,
      check_if_invite: false,
      invited_message: '',
      invitedId: inviterId
    };
  }

  if (inviterId && userData[inviterId]) {
    userData[inviterId].invite += 1;
    userData[inviterId].sold += 1000;
    userData[inviterId].check_if_invite = true;
    userData[inviterId].invited_message = `🎉 Félicitations ! La personne que vous avez invitée a rejoint avec succès. 🥳\n🔄 Vos détails de compte mis à jour :\n👥 Invitations : ${userData[inviterId].invite}\n💰 Solde : ${userData[inviterId].sold} FCFA`;
  }

  const welcomeMessage = `🎉 **Bienvenue, ${msg.from.first_name} !** 🎉  
  🚀 Prêt à démarrer votre aventure pour gagner et grandir avec nous ?  
  
  🌟 **Voici comment commencer :**  
  1️⃣ Invitez vos amis avec votre lien de parrainage unique.  
  2️⃣ Gagnez des récompenses à chaque nouvel inscrit !  
  3️⃣ Consultez vos statistiques à tout moment dans le tableau de bord.  
  
  💰 **Plus vous invitez, plus vous gagnez !**  
  🔥 Prêt à débloquer vos premiers 1 000 points bonus ? Allons-y !  
  
  🎯 Appuyez sur les boutons ci-dessous pour explorer et commencer à gagner dès aujourd'hui.  
  📲 **Bonnes gains et amusez-vous !** 😊`;

  await bot.sendMessage(userId, welcomeMessage, { reply_markup: keyboard1 });
});

// Handle user interactions with the keyboard buttons
bot.on('message', async (msg) => {
  const userId = msg.from.id;
  const text = msg.text;

  if (!userData[userId]) {
    userData[userId] = {
      name: msg.from.first_name,
      invite: 0,
      sold: 0,
      phone: '',
      Bonus: 0,
      subscribed: true,
      check_if_invite: false,
      invited_message: '',
      invitedId: null
    };
  }

  if (userData[userId].check_if_invite) {
    await bot.sendMessage(userId, userData[userId].invited_message);
    userData[userId].check_if_invite = false;
  }

  if (userData[userId].awaiting_phone) {
    if (text.match(/^\d{9,}$/)) {
      userData[userId].phone = text;
      userData[userId].awaiting_phone = false;
      await bot.sendMessage(userId, "📱 Merci pour votre numéro de téléphone ! Votre demande de retrait sera traitée sous peu. 💳");
    } else {
      await bot.sendMessage(userId, "❗ Le numéro saisi est invalide. Veuillez entrer un numéro de téléphone correct.");
    }
    return;
  }

  // Handle other buttons based on user interaction
  if (text === "Solde 💲") {
    const remainingInvites = 10 - userData[userId].invite;
    await bot.sendMessage(userId, `👨🏻‍💼 Nom : ${userData[userId].name}\n🧑‍🤝‍🧑 Amis invités : ${userData[userId].invite}\n💰 Solde actuel : ${userData[userId].sold} FCFA\n\n🚀 Il vous reste encore ${remainingInvites} invitations pour atteindre le seuil de retrait !`);
  }
});

// Create a simple Express web server
app.use(express.json());

app.post(`/webhook/${TOKEN}`, (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

app.get('/', (req, res) => {
  res.send('Hello, World!');
});

app.listen(PORT, async () => {
  console.log(`Server started at http://localhost:${PORT}`);

  // Set the webhook URL
  try {
    const webhookUrl = `${WEBHOOK_URL}/webhook/${TOKEN}`;
    console.log(`Setting webhook to: ${webhookUrl}`);
    await bot.setWebHook(webhookUrl);
    console.log('Webhook set successfully');
  } catch (error) {
    console.error('Error setting webhook:', error);
  }
});
