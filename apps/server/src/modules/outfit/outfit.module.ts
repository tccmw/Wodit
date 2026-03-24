import { Module } from "@nestjs/common";
import { OutfitCatalogService } from "./outfit-catalog.service";

@Module({
  providers: [OutfitCatalogService],
  exports: [OutfitCatalogService]
})
export class OutfitModule {}
