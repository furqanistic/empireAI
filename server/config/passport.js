// File: config/passport.js
import passport from 'passport'
import { Strategy as DiscordStrategy } from 'passport-discord'
import User from '../models/User.js'

// Configure Discord Strategy
passport.use(
  new DiscordStrategy(
    {
      clientID: process.env.DISCORD_CLIENT_ID,
      clientSecret: process.env.DISCORD_CLIENT_SECRET,
      callbackURL: process.env.DISCORD_REDIRECT_URI,
      scope: ['identify', 'email', 'guilds.join'],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        console.log('Discord OAuth profile:', profile)

        // The profile contains Discord user info
        const discordData = {
          discordId: profile.id,
          username: profile.username,
          discriminator: profile.discriminator,
          avatar: profile.avatar,
          email: profile.email,
          isConnected: true,
          connectedAt: new Date(),
        }

        // Return the discord data and tokens for further processing
        return done(null, {
          discordData,
          accessToken,
          refreshToken,
        })
      } catch (error) {
        console.error('Error in Discord strategy:', error)
        return done(error, null)
      }
    }
  )
)

// Serialize user for session
passport.serializeUser((user, done) => {
  done(null, user)
})

// Deserialize user from session
passport.deserializeUser((user, done) => {
  done(null, user)
})

export default passport
