import axios from 'axios'

export async function verifyCaptcha(token: string): Promise<boolean> {
  try {
    const response = await axios.post(
      `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${token}`,
      {},
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded; charset=utf-8"
        },
      },
    );
    return response.data.success;
  } catch (error) {
    console.error('Error verifying CAPTCHA:', error);
    return false;
  }
}