// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'
import { getDB, ObjectId, middlewares } from '../../../lib';

// http://localhost:{port}/script/{id}.js
async function _handler(
  req: NextApiRequest,
  res: NextApiResponse<string|object>
) {
  const id = String(req.query.id).replace('.js', '');
  if(String(id).length !== 24){
    res.status(404).json({ err: 'custom task script id must be 24 chars'});
    return;
  }
  let db = await getDB();
  if (!db) return res.status(500).send('');

  let doc = await db.collection('task').findOne({_id: new ObjectId(id) });
  if(doc){
    if(doc && doc.mode === 'custom' && doc.customScript){
      return res.setHeader('Content-Type', 'text/javascript;charset=UTF-8')
        .setHeader("Cache-Control", "max-age=3600").status(200).send(doc.customScript)
    }else{
      return res.status(400).json({err: "task type mismatch"})
    }
  }else{
    return res.status(404).json({err: 'not found'})
  }
}

export default middlewares.addRequestId(_handler);
