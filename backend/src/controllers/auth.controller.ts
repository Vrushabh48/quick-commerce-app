import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt, { JwtPayload, SignOptions } from "jsonwebtoken";
import { JWT_SECRET, REFRESH_SECRET, REFRESH_EXPIRES_DAYS } from "../config/env";
import { PrismaClient, Role } from "../../db/prisma/generated/client"
// use `prisma` in your application to read and write data in your DB
import type { StringValue } from "ms";

import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });


const ACCESS_EXPIRES: StringValue =
    (process.env.ACCESS_EXPIRES as StringValue) || "15m";

/**
 * =====================
 * TOKEN HELPERS
 * =====================
 */

function signAccessToken(account: { id: number; role: Role }) {
    const options: SignOptions = { expiresIn: ACCESS_EXPIRES };

    return jwt.sign(
        {
            sub: account.id,
            role: account.role,
        },
        JWT_SECRET,
        options
    );
}

function signRefreshToken(accountId: number) {
    return jwt.sign(
        { sub: accountId },
        REFRESH_SECRET,
        { expiresIn: `${REFRESH_EXPIRES_DAYS}d` }
    );
}

/**
 * =====================
 * SIGNUP
 * =====================
 */

export const signup = async (req: Request, res: Response) => {
    try {
        const { email, password, role } = req.body as {
            email: string;
            password: string;
            role?: string;
        };

        if (!email || !password) {
            return res.status(400).json({ error: "Email and password required" });
        }

        const accountRole: Role =
            role && role in Role ? Role[role as keyof typeof Role] : Role.USER;

        const existing = await prisma.account.findUnique({ where: { email } });

        if (existing) {
            return res.status(409).json({ error: "Email already registered" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const account = await prisma.account.create({
            data: {
                email,
                password: hashedPassword,
                role: accountRole,
            },
        });

        const accessToken = signAccessToken(account);
        const refreshToken = signRefreshToken(account.id);

        await prisma.refresh_token.create({
            data: {
                token: refreshToken,
                accountId: account.id,
                expiresAt: new Date(
                    Date.now() +
                        REFRESH_EXPIRES_DAYS * 24 * 60 * 60 * 1000
                ),
            },
        });

        return res.status(201).json({ accessToken, refreshToken });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Internal server error" });
    }
};

/**
 * =====================
 * LOGIN
 * =====================
 */

export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body as {
            email: string;
            password: string;
        };

        const account = await prisma.account.findUnique({ where: { email } });

        if (!account || !account.isActive) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        const passwordOk = await bcrypt.compare(password, account.password);
        if (!passwordOk) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        const accessToken = signAccessToken(account);
        const refreshToken = signRefreshToken(account.id);

        await prisma.refresh_token.create({
            data: {
                token: refreshToken,
                accountId: account.id,
                expiresAt: new Date(
                    Date.now() +
                        REFRESH_EXPIRES_DAYS * 24 * 60 * 60 * 1000
                ),
            },
        });

        return res.json({ accessToken, refreshToken });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Internal server error" });
    }
};

/**
 * =====================
 * REFRESH TOKEN ROTATION
 * =====================
 */

export const refreshToken = async (req: Request, res: Response) => {
    try {
        const { refreshToken } = req.body as { refreshToken: string };

        if (!refreshToken) {
            return res.status(400).json({ error: "refreshToken required" });
        }

        const stored = await prisma.refresh_token.findUnique({
            where: { token: refreshToken },
        });

        if (!stored || stored.revoked || stored.expiresAt < new Date()) {
            return res.status(401).json({ error: "Invalid refresh token" });
        }

        let payload: JwtPayload;
        try {
            payload = jwt.verify(refreshToken, REFRESH_SECRET) as JwtPayload;
        } catch {
            return res.status(401).json({ error: "Invalid refresh token" });
        }

        const accountId = Number(payload.sub);
        if (!accountId || Number.isNaN(accountId)) {
            return res.status(401).json({ error: "Invalid refresh token" });
        }

        const account = await prisma.account.findUnique({
            where: { id: accountId },
        });

        if (!account || !account.isActive) {
            return res.status(401).json({ error: "Invalid refresh token" });
        }

        const [, newToken] = await prisma.$transaction([
            prisma.refresh_token.update({
                where: { id: stored.id },
                data: { revoked: true },
            }),
            prisma.refresh_token.create({
                data: {
                    token: signRefreshToken(account.id),
                    accountId: account.id,
                    expiresAt: new Date(
                        Date.now() +
                            REFRESH_EXPIRES_DAYS * 24 * 60 * 60 * 1000
                    ),
                },
            }),
        ]);

        const accessToken = signAccessToken(account);

        return res.json({
            accessToken,
            refreshToken: newToken.token,
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Internal server error" });
    }
};
