import PDFDocument from "pdfkit";


export const WalletTopUpPdf = (
    user_id: string,
    user_name: string,
    wallet_balance: number,
    amount: number,
    stripe_id: string
): Promise<Buffer> => {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ size: 'A3' });

        const chunks: Buffer[] = [];

        doc.on("data", chunk => chunks.push(chunk));
        doc.on("end", () => resolve(Buffer.concat(chunks)));
        doc.on("error", reject);
        doc.fontSize(35).text("TRANSACTION INVOICE", 120, 80);

        doc.table({
            rowStyles: (i) => {
                if (i == 0) return { backgroundColor: "balck", textColor: "white" }
            },
            data: [
                ['USER ID', 'NAME', 'AMOUNT', 'MERCHANT ID'],
                [user_id, user_name, String(amount), stripe_id]
            ]
        })

        doc.end();
    });
};

