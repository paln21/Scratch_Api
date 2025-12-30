require('dotenv').config();
const axios = require('axios');

// 環境変数から設定を読み込む
const TARGET_USERNAME = process.env.TARGET_USER || 'supp0n'; 
const MY_SESSION_ID = process.env.SCRATCH_SESSION_ID;
const MY_CSRF_TOKEN = process.env.SCRATCH_CSRF_TOKEN;
const MESSAGE = 'TEST';

async function main() {
    console.log('=== Scratch 自動メッセージ送信ツール ===');

    if (!MY_SESSION_ID || !MY_CSRF_TOKEN) {
        console.error('❌ エラー: 環境変数(SESSION_ID, CSRF_TOKEN)が設定されていません。');
        process.exit(1);
    }

    // Cookieを手動で構築（これが「瓶」の代わりになります）
    const cookieString = `scratchsessionsid=${MY_SESSION_ID}; scratchcsrftoken=${MY_CSRF_TOKEN};`;

    try {
        console.log(`送信先: ${TARGET_USERNAME}`);
        console.log('メッセージを送信中...');

        // プロフィールにコメントするAPI
        const response = await axios.post(
            `https://scratch.mit.edu/site-api/comments/user/${TARGET_USERNAME}/add/`,
            {
                content: MESSAGE,
                parent_id: '', // 新規コメントなので空
                commentee_id: '', // 空でOK（URLから判断される）
            },
            {
                headers: {
                    'Cookie': cookieString,
                    'X-CSRFToken': MY_CSRF_TOKEN,
                    'X-Requested-With': 'XMLHttpRequest',
                    'Referer': `https://scratch.mit.edu/users/${TARGET_USERNAME}/`,
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36',
                    'Content-Type': 'application/json'
                }
            }
        );

        if (response.status === 200) {
            console.log('✅ 送信成功！');
            // 成功したHTMLが返ってくるので、念のためログに出しても良い
            // console.log(response.data); 
        } else {
            console.log(`⚠️ 完了しましたがステータスコードが ${response.status} です。`);
        }

    } catch (error) {
        console.error('❌ 送信失敗');
        if (error.response) {
            console.error(`Status: ${error.response.status}`);
            console.error(`Reason: ${error.response.statusText}`);
            // 403の場合はCSRFトークンが無効か、アクセス頻度制限の可能性
        } else {
            console.error(error.message);
        }
        process.exit(1); // Actionsで失敗扱いにする
    }
}

main();
