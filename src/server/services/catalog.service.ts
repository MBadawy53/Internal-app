import { businessLineRepository } from "@/server/repositories/businessLine.repository";
import {
  productCategoryRepository,
  type ListCategoryFilters,
} from "@/server/repositories/productCategory.repository";
import {
  productRepository,
  type ListProductFilters,
} from "@/server/repositories/product.repository";
import { requirePermission, type ActorContext } from "@/lib/auth/permissions";

export const catalogService = {
  listBusinessLines: async (actor: ActorContext) => {
    requirePermission(actor, "list", "businessLine");
    return businessLineRepository.list();
  },

  listCategories: async (actor: ActorContext, filters: ListCategoryFilters = {}) => {
    requirePermission(actor, "list", "productCategory");
    return productCategoryRepository.list(filters);
  },

  listProducts: async (actor: ActorContext, filters: ListProductFilters = {}) => {
    requirePermission(actor, "list", "product");
    return productRepository.list(filters);
  },

  getProduct: async (actor: ActorContext, id: string) => {
    requirePermission(actor, "read", "product");
    return productRepository.findById(id);
  },

  getCategory: async (actor: ActorContext, id: string) => {
    requirePermission(actor, "read", "productCategory");
    return productCategoryRepository.findById(id);
  },
};
