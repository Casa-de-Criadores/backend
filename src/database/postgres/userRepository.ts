// src/database/postgres/userRepository.ts
import { DbClient } from "../client.ts";
import { ulid } from "ulidx";
import { User } from "../../user/models/models.ts";

export class UserRepository {
    constructor(private readonly db: DbClient) {}

    // Fetch all users from the database.
    async getAll(): Promise<User[]> {
        const rows = await this.db.query("SELECT * FROM users");
        // Map each row from the DB to a new User instance.
        return rows.map((row: any) => new User(row));
    }

    // Fetch a single user by ID.
    async getById(userId: string): Promise<User | undefined> {
        const row = await this.db.queryOne("SELECT * FROM users WHERE id = $1", [userId]);
        return row ? new User(row) : undefined;
    }

    // Create a new user. This assumes your user model has the following fields:
    // login, email, password, role. Adjust accordingly if needed.
    async create(userData: { login: string; email: string; password: string; role: string }): Promise<User> {
        const id = ulid();
        const sql = "INSERT INTO users (id, login, email, password, role) VALUES ($1, $2, $3, $4, $5) RETURNING *";
        const rows = await this.db.query(sql, [id, userData.login, userData.email, userData.password, userData.role]);
        return new User(rows[0]);
    }

    // Update an existing user. We dynamically build the update clause based on provided fields.
    async update(
        userId: string,
        userData: Partial<{ login: string; email: string; password: string; role: string }>
    ): Promise<User> {
        const keys = Object.keys(userData);
        if (keys.length === 0) {
            throw new Error("No fields provided to update");
        }
        const setClause = keys.map((key, index) => `"${key}" = $${index + 1}`).join(", ");
        const values = keys.map(key => (userData as any)[key]);
        values.push(userId);
        const sql = `UPDATE users SET ${setClause} WHERE id = $${values.length} RETURNING *`;
        const rows = await this.db.query(sql, values);
        return new User(rows[0]);
    }

    // Delete a single user by ID.
    async deleteOne(userId: string): Promise<void> {
        await this.db.execute("DELETE FROM users WHERE id = $1", [userId]);
    }

    // Delete all users (use with caution, clown).
    async deleteAll(): Promise<void> {
        await this.db.execute("DELETE FROM users");
    }
}
