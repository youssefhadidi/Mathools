import React, { useEffect, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { ExcelIdToInt, mergeFiles, readFile } from '../utils/utils'

function Merge() {
  const [files1, setfiles1] = useState()
  const [files2, setfiles2] = useState()
  const [id1, setId1] = useState('I')
  const [id2, setId2] = useState('E')
  const [compareVal, setCompareId] = useState('W')
  const [retrieveId, setRetrieveId] = useState('P')
  const [result, setResult] = useState()
  const [filter1, setFilter1] = useState('')
  const [filter2, setFilter2] = useState('')
  const [copiedId, setCopiedId] = useState(null)

  function copyId(id) {
    navigator.clipboard.writeText(String(id).trim())
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  async function handleMerge() {
    const buf1 = await readFile(files1[0])
    const buf2 = await readFile(files2[0])
    const res = await mergeFiles(
      buf1,
      buf2,
      ExcelIdToInt(id1),
      ExcelIdToInt(id2),
      ExcelIdToInt(compareVal),
      ExcelIdToInt(retrieveId)
    )
    setResult(res)
  }

  const diffMap = result?.map
  const missingId2 = result?.missingId2

  const diffs = React.useMemo(
    () =>
      Object.keys(diffMap ?? {}).filter(
        (id) => diffMap[id].current && diffMap[id].new && diffMap[id].current != diffMap[id].new
      ),
    [diffMap]
  )

  const missingIdGrouped = React.useMemo(() => {
    const raw = result?.missingId
    if (!raw) return null
    const groups = {}
    raw.forEach(({ id, value }) => {
      if (id == null) return
      const key = String(id)
      if (!groups[key]) groups[key] = { id, sum: 0, values: [] }
      const num = Number(value) || 0
      groups[key].sum += num
      groups[key].values.push(num)
    })
    return Object.values(groups).filter((g) => g.sum !== 0)
  }, [result?.missingId])

  return (
    <div className="merge-root">
      <span>Merge</span>

      <div className="merge-files-row">
        <div className="merge-file-col">
          <XlsxDropZone text="depose ton premier fichier ici" setFiles={setfiles1} />
          <div className="form-group">
            <label>Colonne N° de serie</label>
            <input
              type="text"
              value={id1}
              className="col-input"
              onChange={({ target }) => setId1(target.value)}
            />
          </div>
          <div className="form-group">
            <label>Colonne à comparer</label>
            <input
              type="text"
              value={compareVal}
              className="col-input"
              onChange={({ target }) => setCompareId(target.value)}
            />
          </div>
        </div>

        <div className="merge-file-col">
          <XlsxDropZone text="depose ton deuxieme fichier ici" setFiles={setfiles2} />
          <div className="form-group">
            <label>Colonne N° de serie</label>
            <input
              type="text"
              value={id2}
              className="col-input"
              onChange={({ target }) => setId2(target.value)}
            />
          </div>
          <div className="form-group">
            <label>Colonne à recupérer</label>
            <input
              type="text"
              value={retrieveId}
              className="col-input"
              onChange={({ target }) => setRetrieveId(target.value)}
            />
          </div>
        </div>
      </div>

      <div className="merge-action">
        <button className="merge-btn" onClick={handleMerge}>
          Merge
        </button>
      </div>

      <div className="results-section">
        <div>
          {diffs.map((id) => (
            <div key={id} style={{ padding: '2px 0' }}>
              <span onClick={() => copyId(id)} style={{ cursor: 'pointer', fontWeight: 600 }}>{id}</span> attendue : {diffMap[id].current}, lue : {diffMap[id].new}
            </div>
          ))}
          {diffMap && diffs.length === 0 && <p>Aucune differences</p>}
        </div>

        <div className="missing-lists">
          {missingIdGrouped?.length > 0 && (
            <MissingIdList
              title="IDs fichier 2 manquants"
              items={missingIdGrouped}
              filter={filter1}
              onFilter={setFilter1}
              onCopy={copyId}
              renderLabel={({ id, sum, values }) => (
                <>
                  <HighlightMatch text={id} filter={filter1} />{' '}
                  <span className="sum-badge">
                    {values.length > 1 ? `(${values.join(' + ')} = ${sum})` : `(${sum})`}
                  </span>
                </>
              )}
              idPrefix="missing"
            />
          )}
          {missingId2?.length > 0 && (
            <MissingIdList
              title="IDs fichier 1 manquants"
              items={missingId2.map((id) => ({ id }))}
              filter={filter2}
              onFilter={setFilter2}
              onCopy={copyId}
              renderLabel={({ id }) => <HighlightMatch text={id} filter={filter2} />}
              idPrefix="missing2"
            />
          )}
        </div>
      </div>

      {copiedId !== null && <div className="copy-toast">{copiedId} copié !</div>}
    </div>
  )
}

function MissingIdList({ title, items, filter, onFilter, onCopy, renderLabel, idPrefix }) {
  return (
    <div className="missing-list-col">
      <h4>{title} :</h4>
      <input
        type="text"
        className="form-control"
        placeholder="Filtrer..."
        value={filter}
        onChange={({ target }) => onFilter(target.value)}
        style={{ marginBottom: '0.5rem' }}
      />
      <div className="missing-list-scroll">
        {items.map((item) => (
          <div
            key={item.id}
            className="missing-item"
            style={{ display: String(item.id).includes(filter) ? undefined : 'none' }}
          >
            <label
              htmlFor={`${idPrefix}-${item.id}`}
              onClick={() => onCopy(item.id)}
              style={{ cursor: 'pointer' }}
            >
              {renderLabel(item)}
            </label>
            <input
              type="checkbox"
              name={`${idPrefix}-${item.id}`}
              id={`${idPrefix}-${item.id}`}
              style={{ scale: '1.5' }}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

function HighlightMatch({ text, filter }) {
  if (!filter) return text
  const str = String(text)
  const idx = str.indexOf(filter)
  if (idx === -1) return str
  return (
    <>
      {str.slice(0, idx)}
      <span style={{ backgroundColor: '#f0c040', borderRadius: 2 }}>
        {str.slice(idx, idx + filter.length)}
      </span>
      {str.slice(idx + filter.length)}
    </>
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

export default Merge
