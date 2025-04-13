import {ProductTag} from "../../product/class.ts";
import {DbClient} from "../client.ts";

export class TagRepository {
    constructor(private readonly db: DbClient) {}

    async getByIds(ids: string[]): Promise<ProductTag[]> {
        // Query your database to return an array of ProductTag objects.
        const raws = await this.db.query("SELECT * FROM tags WHERE id = ANY($1)", [ids]);
        // Map raw rows to ProductTag instances
        return raws.map((raw: any) => new ProductTag(raw));
    }
}
