import { Injectable } from '@danet/core';
import { create, getNumericDate, verify } from 'djwt';
import { UserService } from '../user/service.ts';
import { LoginDto } from './dto/login.dto.ts';
import { CustomException, HttpStatus } from '../shared/exception.filter.ts';
import * as bcrypt from 'https://deno.land/x/bcrypt@v0.4.1/mod.ts';

const JWT_SECRET = Deno.env.get('JWT_SECRET') || 'your-super-secret-key';

@Injectable()
export class AuthService {
  constructor(private readonly userService: UserService) {}

  private async getCryptoKey(): Promise<CryptoKey> {
    console.log('🔑 Generating crypto key for JWT...');
    const encoder = new TextEncoder();
    const keyData = encoder.encode(JWT_SECRET);
    return await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      true,
      ['sign', 'verify'],
    );
  }

  async hashPassword(password: string): Promise<string> {
    console.log('🎭 Hashing password for security...');
    try {
      const salt = await bcrypt.genSalt(10); // Add explicit salt rounds
      const hashedPassword = await bcrypt.hash(password, salt);
      console.log('✨ Password hashed successfully!');
      return hashedPassword;
    } catch (error) {
      console.error('🤡 Password hashing failed:', error);
      throw new CustomException(
        HttpStatus.INTERNAL_SERVER_ERROR,
        'Password hashing failed',
      );
    }
  }

  async comparePasswords(plain: string, hashed: string): Promise<boolean> {
    console.log('🎭 Comparing passwords...');
    console.log('Plain password length:', plain.length);
    console.log('Hashed password length:', hashed?.length);

    if (!hashed) {
      console.error('🤡 Hashed password is undefined or empty!');
      return false;
    }

    try {
      const isMatch = await bcrypt.compare(plain, hashed);
      console.log('🎭 Password match result:', isMatch);
      return isMatch;
    } catch (error) {
      console.error('🤡 Password comparison failed:', error);
      return false;
    }
  }

  async login(dto: LoginDto) {
    console.log('🎪 New login attempt for:', dto.login);

    try {
      // Get user
      const user = await this.userService.getByLogin(dto.login);
      if (!user) {
        console.log('🤡 No such user in our circus:', dto.login);
        throw new CustomException(
            HttpStatus.UNAUTHORIZED, // ✅ this is what your test expects
            `Invalid credentials`,
        );
      }``

      console.log('🎭 Found user:', user.login);
      console.log('🎭 Stored hash:', user.passwordHash);
      console.log('🎭 Attempting password match...');

      // Verify password
      const isValid = await this.comparePasswords(
        dto.password,
        user.passwordHash,
      );

      if (!isValid) {
        console.log('🤡 Password mismatch for:', dto.login);
        throw new CustomException(
          HttpStatus.UNAUTHORIZED,
          'Invalid credentials',
        );
      }

      // Generate token
      console.log('✨ Generating JWT token...');
      const key = await this.getCryptoKey();
      const token = await create(
        { alg: 'HS256', typ: 'JWT' },
        {
          sub: user.id,
          role: user.role,
          login: user.login, // Add login to token for easier debugging
          exp: getNumericDate(60 * 60), // 1 hour
        },
        key,
      );

      console.log('🎉 Login successful for:', dto.login);
      return {
        token: `Bearer ${token}`,
        user: {
          id: user.id,
          login: user.login,
          email: user.email,
          role: user.role,
        },
      };
    } catch (error) {
      if (error instanceof CustomException) {
        throw error;
      }
      console.error('🤡 Login process failed:', error);
      throw new CustomException(
        HttpStatus.INTERNAL_SERVER_ERROR,
        'Authentication failed',
      );
    }
  }

  async verifyToken(token: string): Promise<any> {
    console.log('🎭 Verifying JWT token...');
    try {
      const key = await this.getCryptoKey();
      const payload = await verify(token, key);
      console.log('✨ Token verified successfully for:', payload.login);
      return payload;
    } catch (error) {
      console.error('🤡 Token verification failed:', error);
      throw new CustomException(HttpStatus.UNAUTHORIZED, 'Invalid token');
    }
  }

  // Helper method for tests
  async createTestUser(login: string, password: string, role: string) {
    console.log('🎪 Creating test user:', login);
    const hashedPassword = await this.hashPassword(password);
    return await this.userService.create({
      login,
      email: `${login}@test.com`,
      passwordHash: hashedPassword,
      role: role as any,
    });
  }
}
