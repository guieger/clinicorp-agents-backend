import { prisma } from '../config/database';

export const crud = {
  create: async <T>(model: keyof typeof prisma, data: any): Promise<T> => {
    return (prisma[model] as any).create({ data });
  },

  findById: async <T>(model: keyof typeof prisma, id: string, select?: any): Promise<T | null> => {
    return (prisma[model] as any).findUnique({ 
      where: { Id: id },
      ...(select && { select })
    });
  },

  findAll: async <T>(model: keyof typeof prisma, select?: any, orderBy?: any): Promise<T[]> => {
    return (prisma[model] as any).findMany({
      ...(select && { select }),
      ...(orderBy && { orderBy })
    });
  },

  update: async <T>(model: keyof typeof prisma, id: string, data: any, select?: any): Promise<T> => {
    return (prisma[model] as any).update({ 
      where: { Id: id }, 
      data,
      ...(select && { select })
    });
  },

  updateWhere: async <T>(model: keyof typeof prisma, where: any, data: any, select?: any): Promise<T[]> => {
    return (prisma[model] as any).updateMany({ 
      where, 
      data,
      ...(select && { select })
    });
  },

  remove: async <T>(model: keyof typeof prisma, id: string): Promise<T> => {
    return (prisma[model] as any).delete({ where: { id } });
  },

  findMany: async <T>(model: keyof typeof prisma, where?: any, select?: any, orderBy?: any): Promise<T[]> => {
    return (prisma[model] as any).findMany({ 
      ...(where && { where }),
      ...(select && { select }),
      ...(orderBy && { orderBy })
    });
  },

  findFirst: async <T>(model: keyof typeof prisma, where?: any, select?: any, orderBy?: any): Promise<T | null> => {
    return (prisma[model] as any).findFirst({ 
      ...(where && { where }),
      ...(select && { select }),
      ...(orderBy && { orderBy })
    });
  }
};

// Mantendo as exportações individuais para compatibilidade
export const create = crud.create;
export const findById = crud.findById;
export const findAll = crud.findAll;
export const update = crud.update;
export const remove = crud.remove;
export const findMany = crud.findMany;
export const findFirst = crud.findFirst;

