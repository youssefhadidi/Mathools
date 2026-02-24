import { useEffect, useMemo, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { ExcelIdToInt, readFile, readRows } from '../utils/utils'

const parseAmount = (val) => parseFloat(String(val).replace(',', '.')) || 0
const formatAmount = (num) => num.toFixed(2).replace('.', ',')

function mathDisplay(entries) {
  const sum = entries.reduce((acc, e) => acc + e.num, 0)
  const expr = entries
    .map((e, i) => {
      if (i === 0) return e.amount
      return e.num < 0 ? `- ${e.amount.replace('-', '').trim()}` : `+ ${e.amount}`
    })
    .join(' ')
  if (entries.length === 1) return `${entries[0].amount} = ${formatAmount(sum)}`
  return `${expr} = ${formatAmount(sum)}`
}

function PPC() {
  const [file, setFile] = useState()
  const [col1, setCol1] = useState('K')
  const [col2, setCol2] = useState('R')
  const [col3, setCol3] = useState('Q')
  const [rows, setRows] = useState()
  const [copiedId, setCopiedId] = useState(null)

  function copyId(id) {
    navigator.clipboard.writeText(String(id).trim())
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  async function handleLoad() {
    const buf = await readFile(file[0])
    const allRows = readRows(buf)
    const cols = [col1, col2, col3].map(ExcelIdToInt)

    const extracted = allRows
      .map((row) => cols.map((c) => row[c]))
      .filter((row) => row.some((cell) => cell != null))

    const headerIdx = extracted.findIndex((row) => row.every((cell) => typeof cell === 'string'))
    const header = headerIdx !== -1 ? extracted[headerIdx] : [col1, col2, col3]
    const data = extracted.filter((_, i) => i !== headerIdx && extracted[i][0] != null)

    setRows({ header, data })
  }

  const grouped = useMemo(() => {
    if (!rows) return null
    const map = {}
    const order = []
    rows.data.forEach(([id, nature, amount]) => {
      if (!map[id]) {
        map[id] = { maintenance: [], indexService: [], rest: [] }
        order.push(id)
      }
      const entry = { nature: String(nature), amount: String(amount), num: parseAmount(amount) }
      if (String(nature).startsWith('Maintenance')) map[id].maintenance.push(entry)
      else if (String(nature).startsWith('Index/service')) map[id].indexService.push(entry)
      else map[id].rest.push(entry)
    })
    return order.map((id) => ({ id, ...map[id] }))
  }, [rows])

  return (
    <div className="merge-root">
      <span>PPC</span>

      <div className="merge-files-row">
        <div className="merge-file-col">
          <XlsxDropZone text="Dépose ton fichier ici" setFiles={setFile} />
        </div>

        <div className="merge-file-col">
          {[
            { label: 'N° de série', value: col1, set: setCol1 },
            { label: 'Nature', value: col2, set: setCol2 },
            { label: 'Montant TTC', value: col3, set: setCol3 }
          ].map(({ label, value, set }) => (
            <div className="form-group" key={label}>
              <label>{label}</label>
              <input
                type="text"
                value={value}
                className="col-input"
                onChange={({ target }) => set(target.value)}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="merge-action">
        <button className="merge-btn" onClick={handleLoad} disabled={!file?.length}>
          Charger
        </button>
      </div>

      {grouped && (
        <div className="results-section" style={{ overflowY: 'auto' }}>
          <div className="ppc-cards">
            {grouped.map(({ id, maintenance, indexService, rest }) => {
              const mSum = maintenance.reduce((a, e) => a + e.num, 0)
              const iSum = indexService.reduce((a, e) => a + e.num, 0)
              const total = mSum + iSum
              const parts = []
              if (maintenance.length > 0) parts.push(formatAmount(mSum))
              if (indexService.length > 0) parts.push(formatAmount(iSum))
              return (
                <div key={id} className="ppc-card">
                  <div className="ppc-card-id" onClick={() => copyId(id)}>
                    {id}
                  </div>
                  <div className="ppc-card-body">
                    {maintenance.length > 0 && (
                      <div className="ppc-card-section ppc-maintenance">
                        <div className="ppc-card-label">Maintenance</div>
                        <div className="ppc-math">{mathDisplay(maintenance)}</div>
                      </div>
                    )}
                    {indexService.length > 0 && (
                      <div className="ppc-card-section ppc-index">
                        <div className="ppc-card-label">Index/service</div>
                        <div className="ppc-math">{mathDisplay(indexService)}</div>
                      </div>
                    )}
                    {rest.map((entry, i) => (
                      <div key={i} className="ppc-card-section ppc-rest">
                        <div className="ppc-card-label">{entry.nature}</div>
                        <div className="ppc-math">{entry.amount}</div>
                      </div>
                    ))}
                    {parts.length > 0 && (
                      <div className="ppc-card-section">
                        <div className="ppc-card-label">Total</div>
                        <div className="ppc-math">
                          {parts.join(' + ')} = {formatAmount(total)}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
      {copiedId !== null && <div className="copy-toast">{copiedId} copié !</div>}
    </div>
  )
}

function XlsxDropZone({ text, setFiles }) {
  const { acceptedFiles, getRootProps, getInputProps } = useDropzone()
  useEffect(() => {
    setFiles(acceptedFiles)
  }, [acceptedFiles])
  return (
    <div className="dropzone" {...getRootProps()}>
      <input {...getInputProps()} />
      <div>{acceptedFiles.length > 0 ? acceptedFiles[0].name : text}</div>
    </div>
  )
}

export default PPC
