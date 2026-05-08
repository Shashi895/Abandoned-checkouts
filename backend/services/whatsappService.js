import pkg from 'whatsapp-web.js';
const { Client, LocalAuth } = pkg;
import qrcode from 'qrcode-terminal';

class WhatsAppService {
    constructor() {
        this.client = new Client({
            authStrategy: new LocalAuth(),
            puppeteer: {
                args: ['--no-sandbox'],
            }
        });

        this.isReady = false;
        this.queue = [];
        this.isProcessing = false;
        this.delayBetweenMessages = 10000; // 10 seconds delay
    }

    initialize() {
        this.client.on('qr', (qr) => {
            console.log('--- WHATSAPP QR CODE ---');
            qrcode.generate(qr, { small: true });
            console.log('Scan the QR code above to log in to WhatsApp.');
        });

        this.client.on('ready', () => {
            console.log('WhatsApp Client is READY!');
            this.isReady = true;
            this.processQueue(); // Start processing queue if items exist
        });

        this.client.on('authenticated', () => {
            console.log('WhatsApp Authenticated Successfully!');
        });

        this.client.on('auth_failure', (msg) => {
            console.error('WhatsApp Auth Failure:', msg);
        });

        this.client.on('disconnected', (reason) => {
            console.log('WhatsApp Client Disconnected:', reason);
            this.isReady = false;
            // Attempt to re-initialize
            setTimeout(() => this.client.initialize(), 5000);
        });

        this.client.initialize();
    }

    async processQueue() {
        if (this.isProcessing || !this.isReady || this.queue.length === 0) return;

        this.isProcessing = true;

        while (this.queue.length > 0) {
            const { phone, message } = this.queue.shift();
            try {
                let cleanPhone = phone.replace(/\D/g, '');
                if (!cleanPhone.startsWith('91') && cleanPhone.length === 10) {
                    cleanPhone = '91' + cleanPhone;
                }
                
                const chatId = cleanPhone + "@c.us";
                await this.client.sendMessage(chatId, message);
                console.log(`Message sent to ${cleanPhone}. Waiting ${this.delayBetweenMessages/1000}s for next...`);
                
                // Wait for the delay before next message
                if (this.queue.length > 0) {
                    await new Promise(resolve => setTimeout(resolve, this.delayBetweenMessages));
                }
            } catch (error) {
                console.error(`Failed to send message to ${phone}:`, error);
            }
        }

        this.isProcessing = false;
    }

    async sendMessage(phone, message) {
        // Add message to queue
        this.queue.push({ phone, message });
        console.log(`Message for ${phone} added to queue. Total in queue: ${this.queue.length}`);
        
        // Trigger queue processing
        this.processQueue();
        return true;
    }
}

export default new WhatsAppService();
