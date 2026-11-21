import { createApp, analytics, genie, server, getExecutionContext, getWarehouseId } from '@databricks/appkit';
import { z } from 'zod';

const FEEDBACK_TABLE = 'lh_ensaio.gold.feedback_contatos';

const ContatadoBody = z.object({
  lead_id: z.string().regex(/^L\d{8}-\d{4}$/, 'lead_id inválido'),
  vendedor: z.string().trim().min(1).max(80),
  resultado: z.string().trim().max(200).optional(),
});

createApp({
  plugins: [analytics(), genie(), server()],
  onPluginsReady(appkit) {
    appkit.server.extend((app) => {
      // Quem está usando o app (cabeçalhos injetados pelo Databricks Apps).
      app.get('/api/whoami', (req, res) => {
        res.json({
          email: req.header('x-forwarded-email') ?? null,
          user: req.header('x-forwarded-user') ?? null,
        });
      });

      // RF-14: registra o contato em gold.feedback_contatos (única escrita do app).
      app.post('/api/contatado', async (req, res) => {
        const parsed = ContatadoBody.safeParse(req.body);
        if (!parsed.success) {
          res.status(400).json({ error: parsed.error.issues.map((i) => i.message).join('; ') });
          return;
        }
        const { lead_id, vendedor, resultado } = parsed.data;

        try {
          const { client } = getExecutionContext();
          const warehouseId = await getWarehouseId();
          const resp = await client.statementExecution.executeStatement({
            warehouse_id: warehouseId,
            wait_timeout: '30s',
            statement: `INSERT INTO ${FEEDBACK_TABLE} (lead_id, vendedor, contatado_em, resultado)
                        VALUES (:lead_id, :vendedor, current_timestamp(), :resultado)`,
            parameters: [
              { name: 'lead_id', value: lead_id, type: 'STRING' },
              { name: 'vendedor', value: vendedor, type: 'STRING' },
              { name: 'resultado', value: resultado ?? 'contatado', type: 'STRING' },
            ],
          });

          const state = resp.status?.state;
          if (state !== 'SUCCEEDED') {
            res.status(502).json({ error: resp.status?.error?.message ?? `Statement ${state ?? 'sem status'}` });
            return;
          }
          res.status(201).json({ ok: true, lead_id });
        } catch (err) {
          console.error('Falha ao registrar contato', err);
          res.status(500).json({ error: err instanceof Error ? err.message : 'Erro ao registrar contato' });
        }
      });
    });
  },
}).catch(console.error);
