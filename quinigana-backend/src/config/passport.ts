import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { env } from './environment';
import { UserModel } from '../models/user.model';

export function configurePassport(): void {
  passport.use(
    new GoogleStrategy(
      {
        clientID: env.google.clientId,
        clientSecret: env.google.clientSecret,
        callbackURL: env.google.callbackUrl,
        scope: ['email', 'profile'],
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          if (!email) {
            return done(new Error('No email found in Google profile'), undefined);
          }

          let user = await UserModel.findByGoogleId(profile.id);

          if (!user) {
            user = await UserModel.findByEmail(email);

            if (user) {
              await UserModel.linkGoogle(user.id, profile.id, profile.photos?.[0]?.value || null);
              user = await UserModel.findById(user.id);
            } else {
              const userId = await UserModel.createGoogleUser({
                email,
                google_id: profile.id,
                first_name: profile.name?.givenName || profile.displayName || '',
                last_name: profile.name?.familyName || null,
                avatar_url: profile.photos?.[0]?.value || null,
              });
              user = await UserModel.findById(userId);
            }
          }

          return done(null, user || undefined);
        } catch (error) {
          return done(error as Error, undefined);
        }
      }
    )
  );
}
