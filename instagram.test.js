require('dotenv').config();
const { test, expect } = require('@playwright/test');

test('Instagram Mesaj Testi', async ({ page }) => {
  test.slow(); // Testi yavaş modda çalıştır
  const USERNAME = process.env.INSTA_USERNAME;
  const PASSWORD = process.env.INSTA_PASSWORD;
  const RECIPIENT = process.env.INSTA_RECIPIENT;
  const MESSAGE_TEXT = `Playwright test mesajı - ${new Date().toLocaleString()}`;

  console.log('Instagram açılıyor...');
  await page.goto('https://www.instagram.com/accounts/login/', { waitUntil: 'networkidle' });

  console.log('Giriş bilgileri giriliyor...');
  await page.fill('input[name="username"]', USERNAME);
  await page.fill('input[name="password"]', PASSWORD);
  await page.click('button[type="submit"]');

  console.log('Giriş sonrası bekleniyor...');
  try {
    await page.waitForSelector('a[href="/"]', { timeout: 15000 });
  } catch {
    console.log('Ana sayfaya yönlendirilemedi');
  }

  console.log('Mesajlar sayfasına gidiliyor...');
  await page.click('a[href="/direct/inbox/"]');
  await page.waitForSelector('text="Your messages"');

  console.log('Gelen kutusundaki mevcut mesajlar sayılıyor...');
  const initialMessages = await page.$$('div[role="row"]');
  console.log(`📨 Başlangıç mesaj sayısı: ${initialMessages.length}`);

  console.log('Yeni mesaj butonu aranıyor...');
  try {
    await page.click('button:has-text("Send message")', { timeout: 10000 });
  } catch {
    try {
      await page.click('input[placeholder="Search"]', { timeout: 10000 });
    } catch {
      console.log('Yeni mesaj butonu bulunamadı');
      throw new Error('Yeni mesaj butonu bulunamadı');
    }
  }

  console.log('Alıcı seçiliyor...');
  await page.fill('input[placeholder="Search"]', RECIPIENT);
  await page.waitForSelector(`div[role="button"]:has-text("${RECIPIENT}")`);
  await page.click(`div[role="button"]:has-text("${RECIPIENT}")`);

  // Sohbet başlat
  try {
    await page.click('div[role="dialog"] button:has-text("Chat")', { timeout: 10000 });
  } catch {
    console.log('Chat butonu bulunamadı, sohbet penceresi zaten açık olabilir.');
  }

  console.log('Mesaj gönderiliyor...');
  await page.fill('div[role="textbox"]', MESSAGE_TEXT);
  await page.keyboard.press('Enter');
  console.log('✓ Mesaj gönderildi');

  await page.waitForTimeout(2000); // Mesajın görünmesi için kısa bekleme
  await page.waitForSelector(`text="${MESSAGE_TEXT}"`);
  console.log('✓ Mesajın iletildiği doğrulandı');

  console.log('Güncel mesaj sayısı kontrol ediliyor...');
  await page.goto('https://www.instagram.com/direct/inbox/');
  await page.waitForSelector('div[role="row"]');
  
  // Sayfanın tamamen yüklenmesi için ek bekleme
  await page.waitForTimeout(3000);
  
  const updatedMessages = await page.$$('div[role="row"]');
  console.log(`📨 Güncel mesaj sayısı: ${updatedMessages.length}`);
  
  // Detaylı mesaj sayısı doğrulama
  const messageCountDifference = updatedMessages.length - initialMessages.length;
  console.log(`📊 Mesaj sayısı değişimi: ${messageCountDifference > 0 ? '+' : ''}${messageCountDifference}`);
  
  // Mesaj sayısı doğrulama ve raporlama
  if (messageCountDifference > 0) {
    console.log('✅ BAŞARILI: Gelen kutusundaki mesaj sayısı beklenen şekilde arttı!');
    console.log(`   - Başlangıç mesaj sayısı: ${initialMessages.length}`);
    console.log(`   - Son mesaj sayısı: ${updatedMessages.length}`);
    console.log(`   - Artış miktarı: ${messageCountDifference}`);
  } else if (messageCountDifference === 0) {
    console.log('⚠️  UYARI: Mesaj sayısında değişiklik tespit edilemedi!');
    console.log('   Bu durum şu nedenlerden kaynaklanabilir:');
    console.log('   - Mesaj henüz gelen kutusuna yansımamış olabilir');
    console.log('   - Aynı kişiyle daha önce konuşma geçmişi mevcut olabilir');
    console.log('   - Instagram arayüzünde gecikme yaşanıyor olabilir');
  } else {
    console.log('❌ HATA: Mesaj sayısı beklenmedik şekilde azaldı!');
    console.log(`   - Başlangıç: ${initialMessages.length}, Son: ${updatedMessages.length}`);
  }
  
  // Test sonucu assertion
  expect(updatedMessages.length).toBeGreaterThanOrEqual(initialMessages.length);
});
