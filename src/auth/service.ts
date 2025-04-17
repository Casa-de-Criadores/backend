import {Injectable,} from '@danet/core';
import {UserService} from '../user/service.ts';
import {LoginDto} from './dto/login.dto.ts';
import {CustomException, HttpStatus} from '../shared/exception.filter.ts'
import {create, getNumericDate, Header, Payload} from 'https://deno.land/x/djwt@v2.8/mod.ts';
import {UserPublicDto} from "../user/dto/public.dto.ts";

const JWT_SECRET = Deno.env.get('JWT_SECRET') || 'please_set_a_real_secret';

@Injectable()
export class AuthService {
  constructor(private readonly userService: UserService) {}

  /**
   * Expects a validated LoginDto, throws on bad creds,
   * returns a token + UserPublicDto (manually mapped).
   */
  async login(dto: LoginDto): Promise<{ token: string; user: UserPublicDto }> {
    // 1) Fetch the raw User (class User from src/user/class.ts)
    let userRecord;
    try {
      userRecord = this.userService.getByLogin(dto.login);
    } catch {
      throw new CustomException(HttpStatus.UNAUTHORIZED, 'Invalid credentials');
    }

    // 2) Verify password
    if (dto.password !== userRecord.passwordHash) {
      throw new CustomException(HttpStatus.UNAUTHORIZED, 'Invalid credentials');
    }

    // 3) Import the JWT secret as a CryptoKey
    const encoder = new TextEncoder();
    const keyData = encoder.encode(JWT_SECRET);
    const cryptoKey = await crypto.subtle.importKey(
        'raw',
        keyData,
        { name: 'HMAC', hash: 'SHA-256' },
        true,
        ['sign', 'verify']
    );

    // 4) Sign the JWT
    const header: Header = { alg: 'HS256', typ: 'JWT' };
    const payload: Payload = {
      sub: userRecord.id,
      role: userRecord.role,
      exp: getNumericDate(60 * 60), // 1h
    };
    const jwt = await create(header, payload, cryptoKey);

    // 5) Manual mapping to UserPublicDto
    const publicUser = new UserPublicDto(
        userRecord.id,
        userRecord.login,
        userRecord.email,
        userRecord.role,
        userRecord.isDisabled
    );

    return {
      token: `Bearer ${jwt}`,
      user: publicUser,
    };
  }
}