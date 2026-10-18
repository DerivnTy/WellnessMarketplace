import {z} from 'zod';
export const httpsUrl=z.string().url().max(2000).refine(v=>new URL(v).protocol==='https:','Use an HTTPS source URL.');
export const productSchema=z.object({
  id:z.string().regex(/^[a-z0-9-]{2,80}$/),slug:z.string().max(80),name:z.string().min(2).max(150),brand:z.string().min(1).max(100),brandId:z.string().regex(/^[a-z0-9-]+$/),
  category:z.enum(['drinks','hydration','nutrition','apparel','supplements','recovery']),type:z.string().min(2).max(60),description:z.string().min(10).max(1500),
  image:z.string().refine(v=>/^\/products\/[a-zA-Z0-9_.-]+\.(png|jpe?g|webp)$/.test(v),'Use a local product asset.'),
  price:z.number().nonnegative().max(100000).optional(),qty:z.string().max(100),variant:z.string().max(150),servings:z.number().positive().optional(),
  source:httpsUrl,url:httpsUrl,checked:z.string().regex(/^\d{4}-\d{2}-\d{2}$/),available:z.boolean(),status:z.enum(['published','draft']),affiliate:z.literal(false),
  badges:z.array(z.string().max(80)).max(5),attributes:z.record(z.string().max(300)),ingredients:z.string().max(3000),filters:z.record(z.boolean()),facets:z.record(z.array(z.string().max(80)).max(30)).optional(),
  research:z.object({specs:z.record(z.object({value:z.string().max(2000).optional(),status:z.enum(['documented','not-documented','not-applicable']).optional(),sourceUrl:httpsUrl.optional(),checked:z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()})).optional(),inStock:z.boolean().optional(),stockSourceUrl:httpsUrl.optional(),stockChecked:z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()}).optional(),
  terms:z.object({
    returnWindow:z.string().min(1).max(300).optional(),
    restockingFee:z.string().min(1).max(300).optional(),
    returnShipping:z.string().min(1).max(300).optional(),
    delivery:z.string().min(1).max(300).optional(),
    unverified:z.array(z.enum(['returnWindow','restockingFee','returnShipping','delivery'])).max(4).optional(),
    notes:z.array(z.string().min(1).max(300)).max(4).optional(),
  }).optional()
});
export const assessmentSchema=z.object({
  id:z.string().regex(/^[a-z0-9-]{2,80}$/),entity:z.string().min(1).max(80),scope:z.enum(['product','brand','merchant']),
  score:z.number().min(1).max(10),summary:z.string().min(80).max(3000),
  sources:z.array(z.object({url:httpsUrl,label:z.string().min(3).max(200)})).min(2).max(20),
  topics:z.array(z.string().min(3).max(200)).min(1).max(10),coverage:z.string().min(30).max(2000),limitations:z.string().min(20).max(2000),
  reviewed:z.string().regex(/^\d{4}-\d{2}-\d{2}$/),status:z.enum(['draft','published']),methodology:z.literal('community-v1')
});
