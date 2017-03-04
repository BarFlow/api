import htmlToText from 'html-to-text';
import sendgrid from 'sendgrid';
import Handlebars from 'handlebars';
import fs from 'fs';

const sg = sendgrid(process.env.SENDGRID_API_KEY);

const request = ((to, subject, message) => sg.emptyRequest({
  method: 'POST',
  path: '/v3/mail/send',
  body: {
    personalizations: [
      {
        to: [
          {
            email: to,
          }
        ],
        subject,
      },
    ],
    from: {
      name: 'BarFlow',
      email: 'noreply@barflow.io',
    },
    content: [
      {
        type: 'text/plain',
        value: htmlToText.fromString(message),
      },
      {
        type: 'text/html',
        value: message,
      }
    ]
  }
}));

const send = ((to, subject, templateName, data) => {
  try {
    const hbs = fs.readFileSync(`${__dirname}/../templates/${templateName}.hbs`, 'utf-8');
    const template = Handlebars.compile(hbs);
    const message = template(data);
    return sg.API(request(to, subject, message)); // eslint-disable-line
  } catch (e) {
    return Promise.reject(e);
  }
});

export default send;
