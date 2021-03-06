import nodemailer from 'nodemailer'
import Handlebars from 'handlebars'
import { promises as fs } from 'fs'
import path from 'path'
import _  from 'lodash'
import { User } from '../users/user_model'
import { Auth } from '../../middlewares/auth'
import { Client } from '../../services'



export class MailController {

    constructor(){

        this.transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 465,
            secure: true,
            auth: {
                user: process.env.MAIL_ADDRESS,
                pass: process.env.MAIL_PASSWORD
            }
        });

        this.User = User

    }

    verificationMailSender = async(data) => {

        try {

            const token = data.token
            const name = data.name
            const email = data.email
            const url = `http://localhost:${process.env.PORT}/mail/confirm/${token}`;

            const hbs_file = await fs.readFile(path.resolve(__dirname, 'mail_views.hbs'), {encoding: 'utf-8'})
            const template = Handlebars.compile(hbs_file)
            const updated_template = template({
                name: name,
                url: url
            })

            this.transporter.sendMail({
                to: email,
                from: process.env.MAIL_ADDRESS,
                subject: 'Confirm Mail',
                html: updated_template
            })

        } catch (error) {
            throw error
        }
    }

    confirm = async(req, res) => {

        try {

            const user = Auth.verifyAuthToken(req.params.token)
            const user_ID = user._id;
            const found_user = await this.User.findById(user_ID);
            if(!found_user) return Client.handleResponse({
                res: res,
                statusCode: 401,
                data: {
                    message: 'Verification not successfull'
                }
            })

            await this.User.findByIdAndUpdate(user_ID, {
                $set: { isVerified: true }
            }, { new: true })

            res.redirect('http://localhost:4200/auth/login')

        } catch (error) {
            Client.handleError({
                res: res,
                err: error
            })
        }
    }


}