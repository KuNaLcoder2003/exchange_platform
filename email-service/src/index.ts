import nodemailer from "nodemailer"
import { createClient } from "redis";
type mailId = string
type Attachment = {
    fileName: string,
    content: Buffer
    contentType: string
}

const redisClient = createClient()
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: "1.edgeframesolutions@gmail.com",
        pass: `ltsq gwcf qlmh tsig`
    },
    secure: true,
    port: 465
});


const mail = async (emailIds: mailId[], html: string, attachments?: Attachment[]) => {
    const info = await transporter.sendMail({
        from: "1.edgeframesolutions@gmail.com",
        to: emailIds,
        subject: "Meeting for project discussion",
        html: html,
        attachments: attachments
    })
    return { info }

}

const TradeExecuteMail = (data: any, orderId: string) => {
    const { trades, orderStatus, orderSide } = data;

    const totalQuantity = trades.reduce(
        (sum: number, trade: any) => sum + trade.qunatity,
        0
    );

    const totalValue = trades.reduce(
        (sum: number, trade: any) => sum + trade.qunatity * trade.price,
        0
    );

    const tradeRows = trades
        .map(
            (trade: any, index: number) => `
        <tr>
          <td style="padding:12px;border-bottom:1px solid #e5e7eb;">${index + 1}</td>
          <td style="padding:12px;border-bottom:1px solid #e5e7eb;">${trade.qunatity}</td>
          <td style="padding:12px;border-bottom:1px solid #e5e7eb;">₹${trade.price.toFixed(
                2
            )}</td>
          <td style="padding:12px;border-bottom:1px solid #e5e7eb;">₹${(
                    trade.qunatity * trade.price
                ).toFixed(2)}</td>
        </tr>
      `
        )
        .join("");

    return `
<!DOCTYPE html>
<html lang="en">

<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Trade Confirmation</title>
</head>

<body style="margin:0;padding:30px;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif;">

<div style="max-width:720px;margin:auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;box-shadow:0 8px 20px rgba(0,0,0,.05);">

    <!-- Header -->
    <div style="background:#111827;padding:28px;text-align:center;">
        <h2 style="margin:0;color:#ffffff;font-weight:600;">
            Trade Execution Confirmation
        </h2>
    </div>

    <!-- Body -->
    <div style="padding:35px;">

        <p style="font-size:15px;color:#374151;">
            Hello,
        </p>

        <p style="font-size:15px;color:#4b5563;line-height:26px;">
            Your order has been matched successfully and one or more trades have been executed.
            Below is a summary of the execution.
        </p>

        <!-- Summary -->
        <table width="100%" cellspacing="0" cellpadding="10"
            style="margin-top:25px;border:1px solid #e5e7eb;border-collapse:collapse;border-radius:8px;overflow:hidden;">

            <tr style="background:#f9fafb;">
                <td><strong>Order ID</strong></td>
                <td>${orderId}</td>
            </tr>

            <tr>
                <td><strong>Order Side</strong></td>
                <td>${orderSide}</td>
            </tr>

            <tr style="background:#f9fafb;">
                <td><strong>Status</strong></td>
                <td>
                    <span style="
                        background:${orderStatus === "FILLED" ? "#dcfce7" : "#fef3c7"
        };
                        color:${orderStatus === "FILLED" ? "#166534" : "#92400e"
        };
                        padding:6px 14px;
                        border-radius:20px;
                        font-size:13px;
                        font-weight:bold;">
                        ${orderStatus.replace("_", " ")}
                    </span>
                </td>
            </tr>

            <tr>
                <td><strong>Total Executed Quantity</strong></td>
                <td>${totalQuantity}</td>
            </tr>

            <tr style="background:#f9fafb;">
                <td><strong>Total Trade Value</strong></td>
                <td><strong>₹${totalValue.toFixed(2)}</strong></td>
            </tr>

        </table>

        <!-- Trade Details -->
        <h3 style="margin:35px 0 15px;color:#111827;">
            Executed Trades
        </h3>

        <table width="100%" cellspacing="0" cellpadding="0"
            style="border-collapse:collapse;border:1px solid #e5e7eb;">

            <thead style="background:#111827;color:white;">
                <tr>
                    <th style="padding:12px;text-align:left;">#</th>
                    <th style="padding:12px;text-align:left;">Quantity</th>
                    <th style="padding:12px;text-align:left;">Price</th>
                    <th style="padding:12px;text-align:left;">Trade Value</th>
                </tr>
            </thead>

            <tbody>
                ${tradeRows}
            </tbody>

        </table>

        ${orderStatus === "PARTIALLY_FILLED"
            ? `
            <div style="margin-top:28px;padding:16px;background:#fffbeb;border-left:4px solid #f59e0b;border-radius:6px;">
                <strong style="color:#92400e;">Order Still Active</strong>
                <p style="margin:8px 0 0;color:#6b7280;line-height:22px;">
                    Your order has been partially executed. The remaining quantity will stay in the order book until it is matched or cancelled.
                </p>
            </div>
        `
            : `
            <div style="margin-top:28px;padding:16px;background:#ecfdf5;border-left:4px solid #10b981;border-radius:6px;">
                <strong style="color:#047857;">Order Completed</strong>
                <p style="margin:8px 0 0;color:#6b7280;line-height:22px;">
                    Your order has been fully executed successfully.
                </p>
            </div>
        `
        }

        <p style="margin-top:35px;color:#6b7280;line-height:24px;">
            If you have any questions regarding this transaction, please contact our support team.
        </p>

    </div>

    <!-- Footer -->
    <div style="padding:20px;background:#f9fafb;text-align:center;border-top:1px solid #e5e7eb;">
        <p style="margin:0;color:#9ca3af;font-size:12px;">
            This is an automated email. Please do not reply to this message.
        </p>
    </div>

</div>

</body>
</html>
`;
};

const MatchedOrderMail = (
    trade: any,
    side: "BUY" | "SELL"
) => {
    const remaining =
        side === "BUY"
            ? trade.buy_quantity_remaining
            : trade.sell_quantity_remaining;

    const orderId =
        side === "BUY"
            ? trade.buy_order_id
            : trade.sell_order_id;

    const counterPartyOrderId =
        side === "BUY"
            ? trade.sell_order_id
            : trade.buy_order_id;

    const tradeValue = trade.qunatity * trade.price;

    return `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Trade Executed</title>
</head>

<body style="margin:0;padding:30px;background:#f4f6f9;font-family:Arial,Helvetica,sans-serif;">

<div style="max-width:680px;margin:auto;background:#fff;border-radius:10px;border:1px solid #e5e7eb;overflow:hidden;">

    <div style="background:#0f172a;padding:24px;text-align:center;">
        <h2 style="margin:0;color:#fff;">
            Your Order Was Matched
        </h2>
    </div>

    <div style="padding:32px;">

        <p style="font-size:15px;color:#374151;">
            Hello,
        </p>

        <p style="font-size:15px;line-height:24px;color:#4b5563;">
            Good news! Your order has been successfully matched and executed.
            The execution details are shown below.
        </p>

        <table width="100%" cellpadding="10" cellspacing="0"
            style="margin-top:25px;border-collapse:collapse;border:1px solid #e5e7eb;">

            <tr style="background:#f9fafb;">
                <td><strong>Your Order ID</strong></td>
                <td>${orderId}</td>
            </tr>

            <tr>
                <td><strong>Matched Against</strong></td>
                <td>${counterPartyOrderId}</td>
            </tr>

            <tr style="background:#f9fafb;">
                <td><strong>Order Side</strong></td>
                <td>${side}</td>
            </tr>

            <tr>
                <td><strong>Executed Quantity</strong></td>
                <td>${trade.qunatity}</td>
            </tr>

            <tr style="background:#f9fafb;">
                <td><strong>Execution Price</strong></td>
                <td>₹${trade.price}</td>
            </tr>

            <tr>
                <td><strong>Trade Value</strong></td>
                <td><strong>₹${tradeValue}</strong></td>
            </tr>

            <tr style="background:#f9fafb;">
                <td><strong>Remaining Quantity</strong></td>
                <td>${remaining}</td>
            </tr>

            <tr>
                <td><strong>Status</strong></td>
                <td>
                    <span style="
                        display:inline-block;
                        padding:6px 14px;
                        background:${remaining === 0 ? "#dcfce7" : "#fef3c7"};
                        color:${remaining === 0 ? "#166534" : "#92400e"};
                        border-radius:20px;
                        font-weight:bold;
                        font-size:13px;">
                        ${remaining === 0
            ? "COMPLETED"
            : "PARTIALLY FILLED"
        }
                    </span>
                </td>
            </tr>

        </table>

        ${remaining === 0
            ? `
            <div style="margin-top:30px;padding:16px;background:#ecfdf5;border-left:4px solid #10b981;border-radius:6px;">
                <strong style="color:#047857;">Order Completed</strong>
                <p style="margin-top:8px;color:#4b5563;">
                    Your order has been completely executed. No remaining quantity is pending.
                </p>
            </div>
            `
            : `
            <div style="margin-top:30px;padding:16px;background:#fffbeb;border-left:4px solid #f59e0b;border-radius:6px;">
                <strong style="color:#92400e;">Partially Filled</strong>
                <p style="margin-top:8px;color:#4b5563;">
                    Part of your order has been executed. The remaining quantity will stay active until it is matched or cancelled.
                </p>
            </div>
            `
        }

        <p style="margin-top:32px;color:#6b7280;">
            Thank you for trading with us.
        </p>

    </div>

    <div style="background:#f9fafb;padding:18px;text-align:center;border-top:1px solid #e5e7eb;">
        <span style="font-size:12px;color:#9ca3af;">
            This is an automated notification. Please do not reply to this email.
        </span>
    </div>

</div>

</body>
</html>
`;
};

const TransactionMailBody = (user_name: string, user_id: string, amount: Number, merchant_id: string, wallet_balance: Number) => {
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>Wallet Transaction Receipt</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:30px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.1);">

          <tr>
            <td style="background:#2563eb;padding:20px;text-align:center;">
              <h2 style="margin:0;color:#ffffff;">
                Wallet Transaction Receipt
              </h2>
            </td>
          </tr>

          <tr>
            <td style="padding:30px;">
              <p style="font-size:16px;color:#333;">
                Hello <strong>${user_name}</strong>,
              </p>

              <p style="font-size:15px;color:#555;line-height:1.6;">
                Your wallet transaction has been processed successfully.
                Below are the transaction details.
              </p>

              <table width="100%" cellpadding="10" cellspacing="0" style="border-collapse:collapse;margin-top:20px;">
                <tr style="background:#f8f9fa;">
                  <td><strong>User ID</strong></td>
                  <td>${user_id}</td>
                </tr>

                <tr>
                  <td><strong>User Name</strong></td>
                  <td>${user_name}</td>
                </tr>

                <tr style="background:#f8f9fa;">
                  <td><strong>Amount</strong></td>
                  <td>INR ${amount.toFixed(2)}</td>
                </tr>

                <tr>
                  <td><strong>Updated Wallet Balance</strong></td>
                  <td>INR ${wallet_balance.toFixed(2)}</td>
                </tr>

                <tr style="background:#f8f9fa;">
                  <td><strong>Stripe / Merchant ID</strong></td>
                  <td>${merchant_id}</td>
                </tr>
              </table>

              <p style="margin-top:30px;font-size:14px;color:#666;line-height:1.6;">
                Please keep this email for your records. If you have any questions
                regarding this transaction, feel free to contact our support team.
              </p>
            </td>
          </tr>

          <tr>
            <td style="background:#f8f9fa;padding:15px;text-align:center;font-size:12px;color:#888;">
              © ${new Date().getFullYear()} Your Company. All rights reserved.
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}


async function pickMailJobs() {
    await redisClient.connect()
    console.log('Connected To redis')

    try {

        const entry = await redisClient.brPop('MAIL_SERVICE', 0)
        if (!entry) {
            return
        }
        console.log(entry)
        const parsed_entry = JSON.parse(entry?.element!) as { event: "TRADE_EXECUTED" | "ORDER_CANCELLED" | "TRANSACTION_WALLET_TOPUP", data: any }
        console.log(parsed_entry.data)
        switch (parsed_entry.event) {
            case "TRADE_EXECUTED":
                const body = TradeExecuteMail(parsed_entry.data, parsed_entry.data.orderId)
                await mail([parsed_entry.data.email], body)
                let trades = await parsed_entry.data.trades;
                if (parsed_entry.data.orderSide == "SELL") {
                    for (let i = 0; i < trades.length; i++) {
                        const body = MatchedOrderMail(trades[i], "SELL")
                        await mail([trades[i].matched_order_email], body)
                    }
                } else {
                    for (let i = 0; i < trades.length; i++) {
                        const body = MatchedOrderMail(trades[i], "BUY")
                        await mail([trades[i].matched_order_email], body)
                    }
                }
                break;

            case "ORDER_CANCELLED":
                break;
            case "TRANSACTION_WALLET_TOPUP":
                const attachments = parsed_entry.data.attachments.map((attachment: any) => ({
                    filename: attachment.fileName,
                    contentType: attachment.contentType,
                    content: Buffer.from(attachment.content.data),
                }));
                const mail_body = TransactionMailBody(parsed_entry.data.user_name, parsed_entry.data.user_id, Number(parsed_entry.data.amount), parsed_entry.data.merchant_id, Number(parsed_entry.data.wallet_balance))
                await mail([parsed_entry.data.email], mail_body, attachments)
                break;
        }

    } catch (error) {
        console.log(error)
    }
}

while (1) {
    await pickMailJobs()
}