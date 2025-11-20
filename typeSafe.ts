import express, { Request, Response} from 'express';
const app = express();
import { Pool } from 'pg';
import jwt, { JwtPayload } from 'jsonwebtoken';
// import decode from 'jwt-decode';

import bcrypt from 'bcrypt';
import { UUID } from 'crypto';
require('dotenv').config();

interface userTypes extends JwtPayload {
    userID: UUID | string
    role: string
    tokenVersion: number | string
    access: string[] | string; //DESIGN THESE WHEN WE ARE AT THE LEVEL WHERE WE PROVIDE ACCESSES TO THE USERS !!!!PENDING!!!!!
}

type credsTypes = {
    email: string,
    password: string
}


const port: number | string = process.env.PORT || 3000;
const ACTIVE_JWT_SECRET = process.env.ACTIVE_JWT_SECRET as string;
const REFRESH_JWT_SECRET = process.env.REFRESH_JWT_SECRET as string;
app.use(express.json());
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

app.get('/', (req: Request, res:Response )  => {
    return res.status(200).send('<h1>Server is up and running!</h1>');
});

app.post('/signin', async (req: Request, res:Response) => {
    const creds: credsTypes = req?.body;
    const { email, password } = creds;
    if(!email || !password) {
        return res.status(401).json({response: 'Missing Credentials!'});
    }
    //Database checkup
    try{
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        const user: Record<string, string> = result.rows[0];
        if(!user) {
            return res.status(401).json({status: 'Invalid Email or Password!'})
        }
        const match = await bcrypt.compare(password, user.password);
        if(match) {
            //sign jwt for both refreshtoken and active token and send in the response to the app to be stored and send in next request
            const payload: userTypes = {
                userID: user.id,
                role: user.role,
                tokenVersion: user.token_version,
                access: user.access
            }; //access will be included when other screens would be ready!

            const expiredAt: Date = new Date( Date.now() + 30 * 24 * 60 * 60 * 1000);
            const activeToken: string = jwt.sign(payload, ACTIVE_JWT_SECRET, {expiresIn: '15m'});
            const refreshToken: string = jwt.sign(payload, REFRESH_JWT_SECRET, {expiresIn: '30d'});
            const refreshTokenHash: string = await bcrypt.hash(refreshToken, 12);


            const session = await pool.query(`
                INSERT INTO user_sessions(user_id, refresh_token, expired_at)
                VALUES(
                  $1, $2, $3
                );
                `, [user.id,
                  refreshTokenHash,
                  expiredAt]);
            return res.status(200).json({status: 'signin', activeToken, refreshToken});
        }
            return res.status(401).json({status: 'Invalid Email or Password!'});
    } catch(err) {
        console.log(`Error: ${err.message}`);
        return res.status(505).json({error: 'server error during signin!'});
    }
});

//sign-out
app.post('/signout', async (req: Request, res:Response) => {
    const authHeader = req.headers.authorization;
    if(!authHeader){
        return res.json({status: 'no authorization header exist!'});
    }
    const refreshToken = authHeader.split(' ')[1];
    let verified;
    try{
        verified = jwt.verify(refreshToken, REFRESH_JWT_SECRET)
    } catch(err){
        return res.status(401).json({ statusText: 'active token expired!' });
    }
    console.log(`verified: ${verified}`);
    
    const decoded = jwt.decode(refreshToken) as userTypes | null;
    if(!decoded){
         throw new Error('Invalid Refresh Token!');
    }
    let userID: UUID | number | string = decoded.userID;
    
    try{
        const dbRes = await pool.query(
            `SELECT refresh_token, session_id FROM user_sessions WHERE is_revoke = false AND user_id = $1`,
            [userID]
        );
        
        if(dbRes.rowCount === 0){
            return res.json({status: 'no token found!'})
        }
        let RF: Record<string, string> | null = null;
        for (const entry of dbRes.rows) {
            const match = await bcrypt.compare(refreshToken, entry.refresh_token);
            if (match) {
                RF = entry;
                break;
            }
        }

        if (!RF) {
            return res.status(401).json({ status: 'Invalid refresh token' });
        }
        
            
        const session = RF.session_id;
        await pool.query(
            `UPDATE user_sessions SET is_revoke = true, expired_at = NOW() WHERE session_id = $1 AND user_id = $2`,
            [session, userID]
        );
        return res.json({message: 'sign out successful!'});
    }catch(err){
        return res.json(err);
    }

});


app.post('/auth', (req: Request, res:Response) => {
    //verify the tokens received
    //if not verified, send 401 to the app
});

app.post('/refresh-token', (req: Request, res:Response) => {
    //refresh token would be checked here
    //if refresh token is valid, it would generate a new activeToken that the app can use to send with each next request
});

app.listen(port, () => {
    console.log(`server is listening at ${port}`);
});