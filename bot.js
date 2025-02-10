const { Telegraf, Markup } = require('telegraf');
const fs = require('fs');
const path = require('path');

// تحميل التوكن من المتغيرات البيئية أو استخدام قيمة افتراضية
const TOKEN = process.env.TOKEN || "7733359265:AAFOs2Jqssu3T4oEnW0oPew7iPhK564PSUE";
const QUESTIONS = [
    { question: "ما هو ترتيب شهر رمضان في السنة الهجرية؟", options: ["7", "8", "9", "10"], answer: "9" },
    { question: "ما هو حكم صيام رمضان؟", options: ["مستحب", "واجب", "مكروه", "مباح"], answer: "واجب" },
];

// مسار ملف حفظ بيانات المستخدمين
const USER_DATA_FILE = path.join(__dirname, 'user_data.json');
let userProgress = {};

// تحميل بيانات المستخدمين من الملف
function loadUserData() {
    try {
        if (fs.existsSync(USER_DATA_FILE)) {
            const data = fs.readFileSync(USER_DATA_FILE, 'utf8');
            userProgress = JSON.parse(data);
            // تأكد من أن userProgress هو كائن
            if (typeof userProgress !== 'object' || userProgress === null) {
                userProgress = {};
            }
        } else {
            userProgress = {};
        }
    } catch (error) {
        console.error('Error loading user data:', error);
        userProgress = {};
    }
}

// حفظ بيانات المستخدمين إلى الملف
function saveUserData() {
    try {
        if (Object.keys(userProgress).length > 0) {
            fs.writeFileSync(USER_DATA_FILE, JSON.stringify(userProgress, null, 2));
        }
    } catch (error) {
        console.error('Error saving user data:', error);
    }
}

// تنظيف بيانات المستخدمين من الرسائل المحذوفة
function cleanUserProgress() {
    for (const userId in userProgress) {
        if (userProgress[userId] && userProgress[userId].messageIds && userProgress[userId].messageIds.length === 0) {
            delete userProgress[userId];
        }
    }
    saveUserData();
}

// حذف الرسائل السابقة
async function deletePreviousMessages(ctx) {
    const userId = ctx.from.id;
    if (userProgress[userId] && userProgress[userId].messageIds) {
        for (const msgId of userProgress[userId].messageIds) {
            try {
                await ctx.deleteMessage(msgId);
            } catch (error) {
                if (error.response && error.response.error_code === 400 && error.response.description.includes('message to delete not found')) {
                    console.log(`Message ${msgId} not found, skipping deletion.`);
                } else {
                    console.error('Error deleting message:', error);
                }
            }
        }
        userProgress[userId].messageIds = [];
    }
}

// بدء البوت وعرض القائمة الرئيسية
async function start(ctx) {
    const userId = ctx.from.id;
    await deletePreviousMessages(ctx);
    const message = await ctx.reply(
        "مرحبًا بك! 👋\nاضغط على Start للبدء.",
        Markup.keyboard([["Start"]]).resize()
    );
    if (!userProgress[userId]) {
        userProgress[userId] = { messageIds: [] };
    }
    userProgress[userId].messageIds.push(message.message_id);
    saveUserData();
}

// القائمة الرئيسية
async function toMainMenu(ctx) {
    const userId = ctx.from.id;
    await deletePreviousMessages(ctx);
    const message = await ctx.reply(
        "اختر أحد الخيارات:",
        Markup.keyboard([["الأسئلة 🤓", "أذكار ❤️‍🩹"], ["القرءان الكريم 📖😍", "تلاوة 🥰"], ["رجوع 💢"]]).resize()
    );
    userProgress[userId].messageIds = [message.message_id];
    saveUserData();
}

// قائمة الأذكار
async function azkarMenu(ctx) {
    const userId = ctx.from.id;
    await deletePreviousMessages(ctx);
    const message = await ctx.reply(
        "اختر نوع الأذكار:",
        Markup.keyboard([["أذكار الصباح ☀", "أذكار المساء 🌝"], ["رجوع 💢"]]).resize()
    );
    userProgress[userId].messageIds = [message.message_id];
    saveUserData();
}

// قائمة أذكار الصباح
async function morningAzkarMenu(ctx) {
    const userId = ctx.from.id;
    await deletePreviousMessages(ctx);
    const buttons = [];
    for (let i = 1; i <= 10; i++) {
        buttons.push([`الذكر ${i}`]);
    }
    buttons.push(["رجوع 💢"]);
    const message = await ctx.reply(
        "اختر ذكرًا من أذكار الصباح:",
        Markup.keyboard(buttons).resize()
    );
    userProgress[userId].messageIds = [message.message_id];
    saveUserData();
}

// قائمة أذكار المساء
async function eveningAzkarMenu(ctx) {
    const userId = ctx.from.id;
    await deletePreviousMessages(ctx);
    const buttons = [];
    for (let i = 1; i <= 10; i++) {
        buttons.push([`الذكر ${i}`]);
    }
    buttons.push(["رجوع 💢"]);
    const message = await ctx.reply(
        "اختر ذكرًا من أذكار المساء:",
        Markup.keyboard(buttons).resize()
    );
    userProgress[userId].messageIds = [message.message_id];
    saveUserData();
}

// محتوى أذكار الصباح
const morningAzkar = [
    "اللهم فاطر السماوات والأرض، عالم الغيب والشهادة، ربَّ كل شيءٍ ومليكَه، أشهد أن لا إله إلا أنت، أعوذ بك من شر نفسي، ومن شر الشيطان وشِركِه، وأن أقترف على نفسي سوءًا أو أجُرَّه إلى مسلم.\n📖 (رواه الترمذي وأبو داود)",
    "اللهم إني أسألك علمًا نافعًا، ورزقًا طيبًا، وعملاً متقبلاً.\n📖 (رواه ابن ماجه)",
    "اللهم إني أصبحت أُشهدك وأشهد حملة عرشك، وملائكتك، وجميع خلقك، أنك أنت الله لا إله إلا أنت، وحدك لا شريك لك، وأن محمدًا عبدك ورسولك. (أربع مرات)\n📖 (رواه أبو داود والنسائي)",
    "يا حي يا قيوم برحمتك أستغيث، أصلح لي شأني كله، ولا تكلني إلى نفسي طرفة عين.\n📖 (رواه النسائي في الكبرى، والحاكم)",
    "اللهم إني أعوذ بك من الهم والحزن، وأعوذ بك من العجز والكسل، وأعوذ بك من الجُبن والبُخل، وأعوذ بك من غلبة الدين وقهر الرجال.\n📖 (رواه البخاري)",
    "اللهم ما أصبح بي من نعمة أو بأحد من خلقك فمنك وحدك لا شريك لك، فلك الحمد ولك الشكر.\n📖 (رواه أبو داود والنسائي)",
    "سبحان الله وبحمده، عدد خلقه، ورضا نفسه، وزنة عرشه، ومداد كلماته. (ثلاث مرات)\n📖 (رواه مسلم)",
    "اللهم إني أسألك العافية في الدنيا والآخرة، اللهم إني أسألك العفو والعافية في ديني ودنياي وأهلي ومالي.\n📖 (رواه الترمذي)",
    "أصبحنا على فطرة الإسلام، وعلى كلمة الإخلاص، وعلى دين نبينا محمد صلى الله عليه وسلم، وعلى ملة أبينا إبراهيم، حنيفًا مسلمًا وما كان من المشركين.\n📖 (رواه أحمد)",
    "اللهم عافني في بَدَني، اللهم عافني في سمعي، اللهم عافني في بصري، لا إله إلا أنت. (ثلاث مرات)\n📖 (رواه أبو داود)"
];

// محتوى أذكار المساء
const eveningAzkar = [
    "اللهم أنت خلقت نفسي وأنت توفَّاها، لك مماتها ومحياها، إن أحييتها فاحفظها، وإن أمتها فاغفر لها، اللهم إني أسألك العافية.\n📖 (رواه مسلم)",
    "اللهم إني أمسيت أُشهدك وأشهد حملة عرشك، وملائكتك، وجميع خلقك، أنك أنت الله لا إله إلا أنت، وحدك لا شريك لك، وأن محمدًا عبدك ورسولك. (أربع مرات)\n📖 (رواه أبو داود)",
    "اللهم بك أمسينا وبك أصبحنا، وبك نحيا وبك نموت، وإليك المصير.\n📖 (رواه الترمذي)",
    "اللهم اجعل في قلبي نورًا، وفي لساني نورًا، وفي بصري نورًا، وفي سمعي نورًا، ومن فوقي نورًا، ومن تحتي نورًا، وعن يميني نورًا، وعن يساري نورًا، ومن أمامي نورًا، ومن خلفي نورًا، واجعل لي نورًا.\n📖 (رواه مسلم)",
    "اللهم إني أعوذ بك من الجُبن والبخل، وأعوذ بك من أن أُرد إلى أرذل العمر، وأعوذ بك من فتنة الدنيا، وأعوذ بك من عذاب القبر.\n📖 (رواه البخاري)",
    "أعوذ بكلمات الله التامات من غضبه وعقابه، ومن شر عباده، ومن همزات الشياطين، وأن يحضرون.\n📖 (رواه الترمذي)",
    "أعوذ بكلمات الله التامات من شر ما خلق. (ثلاث مرات)\n📖 (رواه مسلم)",
    "اللهم إني أسألك خير هذه الليلة، وخير ما بعدها، وأعوذ بك من شر هذه الليلة، وشر ما بعدها.\n📖 (رواه مسلم)",
    "اللهم إني أعوذ بك من الكسل وسوء الكبر، وأعوذ بك من عذاب في النار وعذاب في القبر.\n📖 (رواه البخاري)",
    "سبحان الله وبحمده. (مئة مرة)\n📖 (رواه البخاري ومسلم)"
];

// عرض ذكر معين من أذكار الصباح
async function showMorningAzkar(ctx, index) {
    const userId = ctx.from.id;
    await deletePreviousMessages(ctx);
    if (index >= 0 && index < morningAzkar.length) {
        const message = await ctx.reply(
            `📖 *الذكر ${index + 1}:*\n${morningAzkar[index]}`,
            {
                parse_mode: "Markdown",
                ...Markup.inlineKeyboard([
                    Markup.button.callback("المواصلة ➡️", `morning_${index + 1}`),
                    Markup.button.callback("العودة 🔙", "back_to_morning_menu")
                ])
            }
        );
        userProgress[userId].messageIds = [message.message_id];
        saveUserData();
    } else {
        await ctx.reply("لا يوجد المزيد من الأذكار.");
    }
}

// عرض ذكر معين من أذكار المساء
async function showEveningAzkar(ctx, index) {
    const userId = ctx.from.id;
    await deletePreviousMessages(ctx);
    if (index >= 0 && index < eveningAzkar.length) {
        const message = await ctx.reply(
            `📖 *الذكر ${index + 1}:*\n${eveningAzkar[index]}`,
            {
                parse_mode: "Markdown",
                ...Markup.inlineKeyboard([
                    Markup.button.callback("المواصلة ➡️", `evening_${index + 1}`),
                    Markup.button.callback("العودة 🔙", "back_to_evening_menu")
                ])
            }
        );
        userProgress[userId].messageIds = [message.message_id];
        saveUserData();
    } else {
        await ctx.reply("لا يوجد المزيد من الأذكار.");
    }
}

// معالجة الأسئلة
async function questionsHandler(ctx) {
    const userId = ctx.from.id;
    await deletePreviousMessages(ctx);
    userProgress[userId] = { ...userProgress[userId], currentQuestionIndex: 0, attempts: 3 };
    await showQuestion(ctx, userId);
}

// عرض السؤال الحالي
async function showQuestion(ctx, userId) {
    const currentQuestionIndex = userProgress[userId].currentQuestionIndex;
    if (currentQuestionIndex < QUESTIONS.length) {
        const question = QUESTIONS[currentQuestionIndex];
        const buttons = question.options.map(option => Markup.button.callback(option, `answer_${option}`));
        const message = await ctx.reply(
            `❓ *السؤال ${currentQuestionIndex + 1}:*\n${question.question}`,
            {
                parse_mode: "Markdown",
                ...Markup.inlineKeyboard(buttons)
            }
        );
        userProgress[userId].messageIds = [message.message_id];
        saveUserData();
    } else {
        await ctx.reply("لقد انتهيت من جميع الأسئلة! 🎉");
    }
}

// معالجة الإجابات
async function handleAnswer(ctx) {
    const userId = ctx.from.id;
    const userAnswer = ctx.callbackQuery.data.replace('answer_', '');
    const currentQuestionIndex = userProgress[userId].currentQuestionIndex;
    const question = QUESTIONS[currentQuestionIndex];

    if (userAnswer === question.answer) {
        await ctx.reply("إجابة صحيحة! 🎉");
        userProgress[userId].currentQuestionIndex += 1;
        userProgress[userId].attempts = 3; // إعادة تعيين المحاولات
        await showQuestion(ctx, userId);
    } else {
        userProgress[userId].attempts -= 1;
        if (userProgress[userId].attempts > 0) {
            await ctx.reply(`إجابة خاطئة! لديك ${userProgress[userId].attempts} محاولة/محاولات متبقية.`, Markup.inlineKeyboard([
                Markup.button.callback("إعادة المحاولة", "retry_question")
            ]));
        } else {
            await ctx.reply("لقد استنفذت جميع محاولاتك! الإجابة الصحيحة هي: " + question.answer, Markup.inlineKeyboard([
                Markup.button.callback("المواصلة ➡️", "next_question")
            ]));
            userProgress[userId].currentQuestionIndex += 1;
            userProgress[userId].attempts = 3; // إعادة تعيين المحاولات
        }
    }
    saveUserData();
}

// تهيئة البوت
const bot = new Telegraf(TOKEN);
loadUserData();

// الأوامر
bot.start(start);
bot.hears("Start", toMainMenu);
bot.hears("الأسئلة 🤓", questionsHandler);
bot.hears("أذكار ❤️‍🩹", azkarMenu);
bot.hears("القرءان الكريم 📖😍", (ctx) => ctx.reply("هذه الميزة غير متاحة حاليًا."));
bot.hears("تلاوة 🥰", (ctx) => ctx.reply("هذه الميزة غير متاحة حاليًا."));
bot.hears("رجوع 💢", toMainMenu);
bot.hears("أذكار الصباح ☀", morningAzkarMenu);
bot.hears("أذكار المساء 🌝", eveningAzkarMenu);

// معالجة أذكار الصباح
for (let i = 0; i < 10; i++) {
    bot.hears(`الذكر ${i + 1}`, (ctx) => showMorningAzkar(ctx, i));
    bot.action(`morning_${i + 1}`, (ctx) => showMorningAzkar(ctx, i + 1));
}

// معالجة أذكار المساء
for (let i = 0; i < 10; i++) {
    bot.hears(`الذكر ${i + 1}`, (ctx) => showEveningAzkar(ctx, i));
    bot.action(`evening_${i + 1}`, (ctx) => showEveningAzkar(ctx, i + 1));
}

// معالجة الإجابات على الأسئلة
bot.action(/answer_/, handleAnswer);
bot.action("retry_question", (ctx) => showQuestion(ctx, ctx.from.id));
bot.action("next_question", (ctx) => showQuestion(ctx, ctx.from.id));

// الرجوع إلى قائمة أذكار الصباح
bot.action("back_to_morning_menu", (ctx) => morningAzkarMenu(ctx));

// الرجوع إلى قائمة أذكار المساء
bot.action("back_to_evening_menu", (ctx) => eveningAzkarMenu(ctx));

// تشغيل البوت باستخدام Long Polling
bot.launch({ polling: true }).then(() => {
    console.log("Bot is running...");
}).catch((error) => {
    console.error("Error starting bot:", error);
});

// إغلاق البوت بشكل أنيق عند إيقاف التشغيل
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

// تنظيف بيانات المستخدمين عند بدء التشغيل
cleanUserProgress();
