import {ProductCategory} from "../../product/class.ts";
import {DbClient} from "../client.ts";

export class CategoryRepository {
    constructor(private readonly db: DbClient) {}

    async getById(id: string): Promise<ProductCategory> {
        // Query your database to return a ProductCategory using ProductCategorySchema
        // For illustration:
        const raw = await this.db.queryOne("SELECT * FROM categories WHERE id = $1", [id]);
        if (!raw) throw new Error("Category not found");
        return new ProductCategory(raw);
    }
}
