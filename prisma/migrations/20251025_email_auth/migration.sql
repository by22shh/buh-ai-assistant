-- Switch from phone to email authentication

-- Add emailVerified column
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "emailVerified" BOOLEAN NOT NULL DEFAULT false;

-- Create LoginToken table for magic links / OTP
CREATE TABLE "LoginToken" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LoginToken_token_key" UNIQUE ("token")
);

-- Create indexes
CREATE INDEX "LoginToken_email_idx" ON "LoginToken"("email");
CREATE INDEX "LoginToken_token_idx" ON "LoginToken"("token");
CREATE INDEX "LoginToken_expiresAt_idx" ON "LoginToken"("expiresAt");
CREATE INDEX "User_email_idx" ON "User"("email");
