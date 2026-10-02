import React, { useState, useEffect, useMemo } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import FileUploadTab from './components/FileUploadTab';
import MasterDataTab from './components/MasterDataTab';
import MappingRulesTab from './components/MappingRulesTab';
import PreviewTraceTab from './components/PreviewTraceTab';
import ExportTab from './components/ExportTab';
import PimDecoderTab from './components/PimDecoderTab';

import {
  readExcelWorkbook,
  parsePIMProductFile,
  parsePIMOptionFile,
  parseCMSCatalogFile,
  parseMappingReferenceFile,
  parseCategoryMappingReferenceFile,
  parseCMSImportTemplate,
  parseCMSValueImportTemplate
} from './services/excelParser';

import {
  getAllMasterDatasets,
  saveMasterDataset,
  removeMasterDataset
} from './services/dbService';

import {
  getCategoryMappings,
  saveCategoryMappings,
  getAttributeMappings,
  saveAttributeMappings,
  getUserConfig,
  saveUserConfig,
  syncRulesFromMappingRef,
  syncCategoriesFromRef
} from './services/storageService';

import { runMappingTransformation } from './services/mappingEngine';
import { useNotification } from './context/NotificationContext';

export default function App() {
  const notify = useNotification();
  const [activeTab, setActiveTab] = useState('upload'); // 'upload' | 'mapping' | 'preview' | 'export'
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Master Reference Data in IndexedDB: { cmsCatalog, pimOption, mappingRef, cmsTemplate }
  const [masterFiles, setMasterFiles] = useState({});

  // Dynamic Multi-File PIM Products: Array of loaded PIM file objects
  const [pimFiles, setPimFiles] = useState([]);

  // Memoized Unified PIM Product Data (combines all products across all uploaded PIM files)
  const pimProductData = useMemo(() => {
    if (!pimFiles || pimFiles.length === 0) return null;

    const allProducts = [];
    const allHeadersSet = new Set();
    let hasMissingCmsId = false;

    pimFiles.forEach(f => {
      if (!f.hasCmsProductIdColumn) hasMissingCmsId = true;
      (f.headers || []).forEach(h => allHeadersSet.add(h));
      (f.products || []).forEach(p => {
        allProducts.push({
          ...p,
          fileOrigin: f.fileName,
          fileId: f.id,
          assignedCmsCategory: f.assignedCmsCategoryId || null,
          assignedCmsCategoryName: f.assignedCmsCategoryName || null
        });
      });
    });

    const distinctCmsIds = new Set(allProducts.map(p => p.cms_product_id).filter(Boolean)).size;
    const distinctModels = new Set(allProducts.map(p => p.model_code).filter(Boolean)).size;

    return {
      isMultiFile: pimFiles.length > 1,
      fileCount: pimFiles.length,
      files: pimFiles,
      fileName: pimFiles.length === 1 ? pimFiles[0].fileName : `${pimFiles.length} file PIM (${allProducts.length.toLocaleString()} SP)`,
      products: allProducts,
      totalRows: allProducts.length,
      distinctCmsIds,
      distinctModels,
      headers: Array.from(allHeadersSet),
      hasCmsProductIdColumn: !hasMissingCmsId
    };
  }, [pimFiles]);

  // Persistent Rule States
  const [categoryMappings, setCategoryMappings] = useState(getCategoryMappings());
  const [attributeMappings, setAttributeMappings] = useState(getAttributeMappings());
  const [userConfig, setUserConfig] = useState(getUserConfig());

  // Transformation Results
  const [transformationResult, setTransformationResult] = useState(null);

  // Load Master Reference Files from IndexedDB on startup
  useEffect(() => {
    async function loadStoredMasters() {
      try {
        const stored = await getAllMasterDatasets();
        setMasterFiles(stored);
        
        // If empty on first visit OR if stored data is from an older schema without rawTableRows/optionsList:
        const isOutdated = 
          !stored.cmsCatalog?.parsedData?.rawTableRows ||
          !stored.pimOption?.parsedData?.optionsList;

        if (!stored.cmsCatalog || !stored.pimOption || !stored.cmsTemplate || !stored.catMappingRef || !stored.cmsValueTemplate || isOutdated) {
          loadSampleMasterData();
        } else if (stored.catMappingRef?.parsedData?.mappings) {
          const merged = syncCategoriesFromRef(stored.catMappingRef.parsedData.mappings, categoryMappings);
          setCategoryMappings(merged);
        }
      } catch (err) {
        console.error('Failed to load master data from IndexedDB:', err);
      }
    }
    loadStoredMasters();
  }, []);

  // Auto save rules on changes
  useEffect(() => {
    saveCategoryMappings(categoryMappings);
  }, [categoryMappings]);

  useEffect(() => {
    saveAttributeMappings(attributeMappings);
  }, [attributeMappings]);

  // Execute Transformation
  const executeTransformation = () => {
    if (!pimProductData || !masterFiles.pimOption?.parsedData || !masterFiles.cmsCatalog?.parsedData) {
      return;
    }

    const result = runMappingTransformation({
      pimProducts: pimProductData.products,
      pimOptions: masterFiles.pimOption.parsedData.optionsMap,
      cmsCatalog: masterFiles.cmsCatalog.parsedData,
      categoryMappings,
      attributeMappings,
      userConfig
    });

    setTransformationResult(result);
  };

  // Re-run transformation when relevant data changes
  useEffect(() => {
    if (pimProductData && masterFiles.pimOption?.parsedData && masterFiles.cmsCatalog?.parsedData) {
      executeTransformation();
    }
  }, [pimProductData, masterFiles, categoryMappings, attributeMappings]);

  // Handle Master File Upload and save to IndexedDB
  const handleUpdateMasterFile = async (type, file) => {
    setIsLoading(true);
    try {
      const buffer = await file.arrayBuffer();
      const wb = await readExcelWorkbook(buffer);
      const sheet = wb.Sheets[wb.SheetNames[0]];

      let parsedData = null;
      let summary = {};

      if (type === 'cmsCatalog') {
        parsedData = parseCMSCatalogFile(sheet);
        summary = {
          categoriesCount: parsedData.categories.length,
          propertiesCount: parsedData.properties.size
        };
      } else if (type === 'pimOption') {
        parsedData = parsePIMOptionFile(sheet);
        summary = { totalOptions: parsedData.totalOptions };
      } else if (type === 'mappingRef') {
        parsedData = parseMappingReferenceFile(sheet);
        summary = { count: parsedData.length };
        // Tự động đồng bộ các quy tắc thuộc tính từ file tham chiếu (Ưu tiên 1)
        const { mergedAttrs, mergedCats } = syncRulesFromMappingRef(parsedData, attributeMappings, categoryMappings);
        setAttributeMappings(mergedAttrs);
        setCategoryMappings(mergedCats);
        notify.info(`Đã tự động cập nhật ${parsedData.length} quy tắc từ file tham chiếu (Ưu tiên 1)!`);
      } else if (type === 'catMappingRef') {
        parsedData = parseCategoryMappingReferenceFile(sheet);
        summary = { count: parsedData.mappings.length };
        // Tự động đồng bộ các ngành hàng vào categoryMappings
        const merged = syncCategoriesFromRef(parsedData.mappings, categoryMappings);
        setCategoryMappings(merged);
      } else if (type === 'cmsTemplate') {
        parsedData = parseCMSImportTemplate(wb);
        summary = { sheetName: parsedData.sheetName, headersCount: parsedData.headers.length };
      } else if (type === 'cmsValueTemplate') {
        parsedData = parseCMSValueImportTemplate(wb);
        summary = {
          sheetName: parsedData.sheetName,
          headersCount: parsedData.headers.length,
          sampleRowsCount: parsedData.sampleRowsCount,
          defaultConfig: parsedData.defaultConfig
        };
      }

      const item = {
        id: type,
        fileName: file.name,
        updatedAt: new Date().toISOString(),
        summary,
        parsedData,
        rawBuffer: buffer
      };

      await saveMasterDataset(type, item);
      setMasterFiles(prev => ({ ...prev, [type]: item }));
      notify.success(`Đã cập nhật và lưu trữ thành công file "${file.name}" vào cơ sở dữ liệu!`);
    } catch (err) {
      notify.error(`Lỗi khi đọc file "${file.name}": ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Save edited master dataset directly from modal to IndexedDB
  const handleSaveMasterDataset = async (type, updatedParsedData, updatedSummary) => {
    try {
      const existing = masterFiles[type] || {};
      const updatedItem = {
        ...existing,
        id: type,
        fileName: existing.fileName || `${type}.xlsx`,
        updatedAt: new Date().toISOString(),
        summary: updatedSummary || existing.summary,
        parsedData: updatedParsedData
      };
      await saveMasterDataset(type, updatedItem);
      setMasterFiles(prev => ({ ...prev, [type]: updatedItem }));

      if (type === 'catMappingRef' && updatedParsedData?.mappings) {
        const merged = syncCategoriesFromRef(updatedParsedData.mappings, categoryMappings);
        setCategoryMappings(merged);
      } else if (type === 'mappingRef' && (Array.isArray(updatedParsedData) || updatedParsedData?.length)) {
        const { mergedAttrs, mergedCats } = syncRulesFromMappingRef(updatedParsedData, attributeMappings, categoryMappings);
        setAttributeMappings(mergedAttrs);
        setCategoryMappings(mergedCats);
      }

      return true;
    } catch (err) {
      console.error('Lỗi lưu dataset vào IndexedDB:', err);
      notify.error('Lỗi khi lưu dữ liệu vào IndexedDB: ' + err.message);
      return false;
    }
  };

  // Reset all master data
  const handleResetMasterFiles = async () => {
    const confirmed = await notify.confirm({
      title: 'Đặt lại toàn bộ dữ liệu nền',
      message: 'Bạn có chắc chắn muốn xóa toàn bộ 6 file dữ liệu nền tảng đang lưu trữ trong cơ sở dữ liệu không?',
      type: 'danger',
      confirmText: 'Xóa vĩnh viễn',
      cancelText: 'Hủy bỏ'
    });

    if (confirmed) {
      await removeMasterDataset('cmsCatalog');
      await removeMasterDataset('pimOption');
      await removeMasterDataset('mappingRef');
      await removeMasterDataset('catMappingRef');
      await removeMasterDataset('cmsTemplate');
      await removeMasterDataset('cmsValueTemplate');
      setMasterFiles({});
      notify.info('Đã xóa dữ liệu nền. Bạn có thể nạp lại file mới hoặc bấm "⚡ Nạp trọn bộ dữ liệu nền mẫu".');
    }
  };

  // Pre-load sample master reference datasets into IndexedDB
  const loadSampleMasterData = async () => {
    setIsLoading(true);
    try {
      // 1. CMS Catalog
      const resCms = await fetch('./samples/tt-adapter-cms.xlsx');
      const bufCms = await resCms.arrayBuffer();
      const wbCms = await readExcelWorkbook(bufCms);
      const parsedCms = parseCMSCatalogFile(wbCms.Sheets[wbCms.SheetNames[0]]);
      const itemCms = {
        id: 'cmsCatalog',
        fileName: 'tt-adapter-cms.xlsx',
        updatedAt: new Date().toISOString(),
        summary: { categoriesCount: parsedCms.categories.length, propertiesCount: parsedCms.properties.size },
        parsedData: parsedCms,
        rawBuffer: bufCms
      };
      await saveMasterDataset('cmsCatalog', itemCms);

      // 2. PIM Option
      const resOpt = await fetch('./samples/export_attribute_option20260929134516.xlsx');
      const bufOpt = await resOpt.arrayBuffer();
      const wbOpt = await readExcelWorkbook(bufOpt);
      const parsedOpt = parsePIMOptionFile(wbOpt.Sheets[wbOpt.SheetNames[0]]);
      const itemOpt = {
        id: 'pimOption',
        fileName: 'export_attribute_option20260929134516.xlsx',
        updatedAt: new Date().toISOString(),
        summary: { totalOptions: parsedOpt.totalOptions },
        parsedData: parsedOpt,
        rawBuffer: bufOpt
      };
      await saveMasterDataset('pimOption', itemOpt);

      // 3. Mapping Ref
      const resMap = await fetch('./samples/file-mapping-cms-pim.xlsx');
      const bufMap = await resMap.arrayBuffer();
      const wbMap = await readExcelWorkbook(bufMap);
      const parsedMap = parseMappingReferenceFile(wbMap.Sheets[wbMap.SheetNames[0]]);
      const itemMap = {
        id: 'mappingRef',
        fileName: 'file-mapping-cms-pim.xlsx',
        updatedAt: new Date().toISOString(),
        summary: { count: parsedMap.length },
        parsedData: parsedMap,
        rawBuffer: bufMap
      };
      await saveMasterDataset('mappingRef', itemMap);

      // 4. CMS Template
      const resTpl = await fetch('./samples/import_5205 (1).xlsx');
      const bufTpl = await resTpl.arrayBuffer();
      const wbTpl = await readExcelWorkbook(bufTpl);
      const parsedTpl = parseCMSImportTemplate(wbTpl);
      const itemTpl = {
        id: 'cmsTemplate',
        fileName: 'import_5205 (1).xlsx',
        updatedAt: new Date().toISOString(),
        summary: { sheetName: parsedTpl.sheetName, headersCount: parsedTpl.headers.length },
        parsedData: parsedTpl,
        rawBuffer: bufTpl
      };
      await saveMasterDataset('cmsTemplate', itemTpl);

      // 5. Category Mapping Ref (ma_ho_tgdd_cms_pim.xlsx)
      let itemCatMap = null;
      try {
        const resCat = await fetch('./samples/ma_ho_tgdd_cms_pim.xlsx');
        const bufCat = await resCat.arrayBuffer();
        const wbCat = await readExcelWorkbook(bufCat);
        const parsedCat = parseCategoryMappingReferenceFile(wbCat.Sheets[wbCat.SheetNames[0]]);
        itemCatMap = {
          id: 'catMappingRef',
          fileName: 'ma_ho_tgdd_cms_pim.xlsx',
          updatedAt: new Date().toISOString(),
          summary: { count: parsedCat.mappings.length },
          parsedData: parsedCat,
          rawBuffer: bufCat
        };
        await saveMasterDataset('catMappingRef', itemCatMap);
        // Tự động đồng bộ các ngành hàng vào categoryMappings
        const merged = syncCategoriesFromRef(parsedCat.mappings, categoryMappings);
        setCategoryMappings(merged);
      } catch (catErr) {
        console.warn('Lỗi nạp file mapping ngành hàng mẫu:', catErr);
      }

      // 6. CMS Value Import Template (file_mau_import_gia_tri_tren_cms.xlsx)
      let itemValTpl = null;
      try {
        const resValTpl = await fetch('./samples/file_mau_import_gia_tri_tren_cms.xlsx');
        const bufValTpl = await resValTpl.arrayBuffer();
        const wbValTpl = await readExcelWorkbook(bufValTpl);
        const parsedValTpl = parseCMSValueImportTemplate(wbValTpl);
        itemValTpl = {
          id: 'cmsValueTemplate',
          fileName: 'file_mau_import_gia_tri_tren_cms.xlsx',
          updatedAt: new Date().toISOString(),
          summary: {
            sheetName: parsedValTpl.sheetName,
            headersCount: parsedValTpl.headers.length,
            sampleRowsCount: parsedValTpl.sampleRowsCount,
            defaultConfig: parsedValTpl.defaultConfig
          },
          parsedData: parsedValTpl,
          rawBuffer: bufValTpl
        };
        await saveMasterDataset('cmsValueTemplate', itemValTpl);
      } catch (valErr) {
        console.warn('Lỗi nạp file mẫu import giá trị CMS:', valErr);
      }

      setMasterFiles({
        cmsCatalog: itemCms,
        pimOption: itemOpt,
        mappingRef: itemMap,
        catMappingRef: itemCatMap,
        cmsTemplate: itemTpl,
        cmsValueTemplate: itemValTpl
      });
    } catch (err) {
      console.error('Error preloading sample master data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Multi-File PIM Product upload
  const handlePimFilesLoaded = async (filesToLoad, isAppend = true) => {
    const rawFiles = Array.isArray(filesToLoad) 
      ? filesToLoad 
      : (filesToLoad instanceof FileList ? Array.from(filesToLoad) : [filesToLoad]);
    
    if (rawFiles.length === 0) return;

    setIsLoading(true);
    try {
      const newFilesList = [];
      const errors = [];

      for (const file of rawFiles) {
        try {
          const buffer = await file.arrayBuffer();
          const wb = await readExcelWorkbook(buffer);
          const sheet = wb.Sheets[wb.SheetNames[0]];
          const parsed = parsePIMProductFile(sheet, file.name);

          // Detect CMS category candidates from categoryMappings
          let candidateCmsCatId = null;
          let candidateCmsCatName = null;
          const mappedCategories = [];

          if (parsed.detectedCategoryCodes.length > 0) {
            for (const code of parsed.detectedCategoryCodes) {
              const foundCat = categoryMappings.find(c => String(c.pimCategoryCode).trim() === String(code).trim());
              if (foundCat) {
                mappedCategories.push({
                  pimCode: code,
                  cmsId: foundCat.cmsCategoryId,
                  cmsName: foundCat.cmsCategoryName
                });
              } else {
                mappedCategories.push({
                  pimCode: code,
                  cmsId: null,
                  cmsName: 'Chưa có mapping'
                });
              }
            }
            // Fallback backward compatibility for single-category logic
            const firstCode = parsed.detectedCategoryCodes[0];
            const foundCat = categoryMappings.find(c => String(c.pimCategoryCode).trim() === String(firstCode).trim());
            if (foundCat) {
              candidateCmsCatId = foundCat.cmsCategoryId;
              candidateCmsCatName = foundCat.cmsCategoryName;
            }
          }

          newFilesList.push({
            id: `pim_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
            fileName: file.name,
            fileSize: file.size,
            uploadedAt: new Date().toISOString(),
            headers: parsed.headers,
            labels: parsed.labels,
            products: parsed.products,
            totalRows: parsed.totalRows,
            hasCmsProductIdColumn: parsed.hasCmsProductIdColumn,
            detectedCategoryCodes: parsed.detectedCategoryCodes,
            distinctModels: parsed.distinctModels,
            distinctCmsIds: parsed.distinctCmsIds,
            assignedCmsCategoryId: candidateCmsCatId,
            assignedCmsCategoryName: candidateCmsCatName,
            mappedCategories: mappedCategories
          });
        } catch (err) {
          errors.push(`"${file.name}": ${err.message}`);
        }
      }

      if (newFilesList.length > 0) {
        setPimFiles(prev => {
          if (!isAppend) return newFilesList;
          // Filter out files with duplicate name from prev
          const newNames = new Set(newFilesList.map(f => f.fileName));
          const remainingPrev = prev.filter(f => !newNames.has(f.fileName));
          return [...remainingPrev, ...newFilesList];
        });

        const totalRowsLoaded = newFilesList.reduce((acc, f) => acc + f.totalRows, 0);
        notify.success(
          `Đã nạp thành công ${newFilesList.length} file sản phẩm PIM (${totalRowsLoaded.toLocaleString()} dòng sản phẩm)!`,
          'Nạp PIM thành công'
        );
      }

      if (errors.length > 0) {
        notify.error(`Lỗi khi đọc một số file: ${errors.join(', ')}`);
      }
    } catch (err) {
      notify.error('Lỗi khi nạp file PIM: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Remove a single PIM file
  const handleRemovePimFile = (fileId) => {
    setPimFiles(prev => {
      const fileToRemove = prev.find(f => f.id === fileId);
      const remaining = prev.filter(f => f.id !== fileId);
      notify.info(`Đã loại bỏ file "${fileToRemove?.fileName || 'PIM'}" khỏi danh sách xử lý.`);
      return remaining;
    });
  };

  // Clear all PIM files
  const handleClearAllPimFiles = async () => {
    const confirmed = await notify.confirm({
      title: 'Xóa toàn bộ file PIM',
      message: 'Bạn có chắc chắn muốn xóa toàn bộ các file sản phẩm PIM đã nạp để tải lại từ đầu không?',
      type: 'danger',
      confirmText: 'Xóa toàn bộ',
      cancelText: 'Hủy'
    });
    if (confirmed) {
      setPimFiles([]);
      setTransformationResult(null);
      notify.info('Đã xóa toàn bộ file PIM khỏi danh sách.');
    }
  };

  // Quick assign / change CMS Category for a specific PIM file
  const handleAssignCategoryToFile = (fileId, cmsCategoryId, cmsCategoryName) => {
    setPimFiles(prev => prev.map(f => {
      if (f.id === fileId) {
        return {
          ...f,
          assignedCmsCategoryId: cmsCategoryId,
          assignedCmsCategoryName: cmsCategoryName
        };
      }
      return f;
    }));
    notify.success(`Đã gán ngành hàng "${cmsCategoryName}" cho file.`);
  };

  // Fast load sample PIM product file (Adapter sạc 528 rows with model_id_cms)
  const handleLoadSamplePimProduct = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('./samples/sp_pim_adapter.xlsx');
      const buf = await res.arrayBuffer();
      const wb = await readExcelWorkbook(buf);
      const parsed = parsePIMProductFile(wb.Sheets[wb.SheetNames[0]], 'sp_pim_adapter.xlsx');
      
      const sampleFileObj = {
        id: 'sample_adapter_sac',
        fileName: 'sp_pim_adapter.xlsx',
        fileSize: buf.byteLength,
        uploadedAt: new Date().toISOString(),
        headers: parsed.headers,
        labels: parsed.labels,
        products: parsed.products,
        totalRows: parsed.totalRows,
        productsCount: parsed.totalRows,
        categoryCode: parsed.detectedCategoryCodes?.[0] || 'adapter',
        hasCmsProductIdColumn: parsed.hasCmsProductIdColumn,
        detectedCategoryCodes: parsed.detectedCategoryCodes,
        distinctModels: parsed.distinctModels,
        distinctCmsIds: parsed.distinctCmsIds,
        assignedCmsCategoryId: '9499',
        assignedCategoryId: '9499',
        assignedCmsCategoryName: 'Adapter sạc'
      };

      setPimFiles(prev => {
        const withoutSample = prev.filter(f => f.fileName !== 'sp_pim_adapter.xlsx');
        return [...withoutSample, sampleFileObj];
      });
      notify.success('Đã nạp file PIM mẫu ngành Adapter sạc (528 sản phẩm)!');
    } catch (err) {
      notify.error('Lỗi khi nạp file PIM mẫu: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Load ALL Sample Datasets (Master + PIM Product) and switch to Preview
  const handleLoadSampleAll = async () => {
    setIsLoading(true);
    try {
      // 1. CMS Catalog
      const resCms = await fetch('./samples/tt-adapter-cms.xlsx');
      const bufCms = await resCms.arrayBuffer();
      const wbCms = await readExcelWorkbook(bufCms);
      const parsedCms = parseCMSCatalogFile(wbCms.Sheets[wbCms.SheetNames[0]]);
      const itemCms = {
        id: 'cmsCatalog',
        fileName: 'tt-adapter-cms.xlsx',
        updatedAt: new Date().toISOString(),
        summary: { categoriesCount: parsedCms.categories.length, propertiesCount: parsedCms.properties.size, totalRows: parsedCms.totalRows },
        parsedData: parsedCms,
        rawBuffer: bufCms
      };
      await saveMasterDataset('cmsCatalog', itemCms);

      // 2. PIM Option
      const resOpt = await fetch('./samples/export_attribute_option20260929134516.xlsx');
      const bufOpt = await resOpt.arrayBuffer();
      const wbOpt = await readExcelWorkbook(bufOpt);
      const parsedOpt = parsePIMOptionFile(wbOpt.Sheets[wbOpt.SheetNames[0]]);
      const itemOpt = {
        id: 'pimOption',
        fileName: 'export_attribute_option20260929134516.xlsx',
        updatedAt: new Date().toISOString(),
        summary: { totalOptions: parsedOpt.totalOptions },
        parsedData: parsedOpt,
        rawBuffer: bufOpt
      };
      await saveMasterDataset('pimOption', itemOpt);

      // 3. Mapping Ref
      const resMap = await fetch('./samples/file-mapping-cms-pim.xlsx');
      const bufMap = await resMap.arrayBuffer();
      const wbMap = await readExcelWorkbook(bufMap);
      const parsedMap = parseMappingReferenceFile(wbMap.Sheets[wbMap.SheetNames[0]]);
      const itemMap = {
        id: 'mappingRef',
        fileName: 'file-mapping-cms-pim.xlsx',
        updatedAt: new Date().toISOString(),
        summary: { count: parsedMap.length },
        parsedData: parsedMap,
        rawBuffer: bufMap
      };
      await saveMasterDataset('mappingRef', itemMap);

      // Sync rules from mappingRef
      const { mergedAttrs, mergedCats } = syncRulesFromMappingRef(parsedMap, attributeMappings, categoryMappings);
      setAttributeMappings(mergedAttrs);
      setCategoryMappings(mergedCats);

      // 4. CMS Template
      const resTpl = await fetch('./samples/import_5205 (1).xlsx');
      const bufTpl = await resTpl.arrayBuffer();
      const wbTpl = await readExcelWorkbook(bufTpl);
      const parsedTpl = parseCMSImportTemplate(wbTpl);
      const itemTpl = {
        id: 'cmsTemplate',
        fileName: 'import_5205 (1).xlsx',
        updatedAt: new Date().toISOString(),
        summary: { sheetName: parsedTpl.sheetName, headersCount: parsedTpl.headers.length, sampleRowsCount: parsedTpl.sampleRowsCount },
        parsedData: parsedTpl,
        rawBuffer: bufTpl
      };
      await saveMasterDataset('cmsTemplate', itemTpl);

      // 4b. CMS Value Import Template (file_mau_import_gia_tri_tren_cms.xlsx)
      let itemValTpl = null;
      try {
        const resValTpl = await fetch('./samples/file_mau_import_gia_tri_tren_cms.xlsx');
        const bufValTpl = await resValTpl.arrayBuffer();
        const wbValTpl = await readExcelWorkbook(bufValTpl);
        const parsedValTpl = parseCMSValueImportTemplate(wbValTpl);
        itemValTpl = {
          id: 'cmsValueTemplate',
          fileName: 'file_mau_import_gia_tri_tren_cms.xlsx',
          updatedAt: new Date().toISOString(),
          summary: {
            sheetName: parsedValTpl.sheetName,
            headersCount: parsedValTpl.headers.length,
            sampleRowsCount: parsedValTpl.sampleRowsCount,
            defaultConfig: parsedValTpl.defaultConfig
          },
          parsedData: parsedValTpl,
          rawBuffer: bufValTpl
        };
        await saveMasterDataset('cmsValueTemplate', itemValTpl);
      } catch (valErr) {
        console.warn('Lỗi nạp file mẫu import giá trị CMS:', valErr);
      }

      setMasterFiles({
        cmsCatalog: itemCms,
        pimOption: itemOpt,
        mappingRef: itemMap,
        catMappingRef: masterFiles.catMappingRef,
        cmsTemplate: itemTpl,
        cmsValueTemplate: itemValTpl
      });

      // 5. PIM Product with model_id_cms
      const resProd = await fetch('./samples/sp_pim_adapter.xlsx');
      const bufProd = await resProd.arrayBuffer();
      const wbProd = await readExcelWorkbook(bufProd);
      const parsedProd = parsePIMProductFile(wbProd.Sheets[wbProd.SheetNames[0]], 'sp_pim_adapter.xlsx');

      const sampleFileObj = {
        id: 'sample_adapter_sac',
        fileName: 'sp_pim_adapter.xlsx',
        fileSize: bufProd.byteLength,
        uploadedAt: new Date().toISOString(),
        headers: parsedProd.headers,
        labels: parsedProd.labels,
        products: parsedProd.products,
        totalRows: parsedProd.totalRows,
        productsCount: parsedProd.totalRows,
        categoryCode: parsedProd.detectedCategoryCodes?.[0] || 'adapter',
        hasCmsProductIdColumn: parsedProd.hasCmsProductIdColumn,
        detectedCategoryCodes: parsedProd.detectedCategoryCodes,
        distinctModels: parsedProd.distinctModels,
        distinctCmsIds: parsedProd.distinctCmsIds,
        assignedCmsCategoryId: '9499',
        assignedCategoryId: '9499',
        assignedCmsCategoryName: 'Adapter sạc'
      };

      setPimFiles([sampleFileObj]);

      // Switch to preview tab
      setActiveTab('preview');
      notify.success('Đã nạp trọn bộ dữ liệu mẫu và hoàn tất đối chiếu sang CMS!');
    } catch (err) {
      notify.error('Lỗi nạp dữ liệu mẫu: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSupplementCmsId = (modelCode, newCmsId) => {
    if (!modelCode || !newCmsId) return;
    const cleanId = String(newCmsId).trim();
    setPimFiles(prevFiles => {
      return prevFiles.map(file => ({
        ...file,
        products: file.products.map(p => {
          if (p.model_code === modelCode || String(p.model_code).trim() === String(modelCode).trim()) {
            return { ...p, cms_product_id: cleanId };
          }
          return p;
        })
      }));
    });
    notify.success(`Đã bổ sung mã CMS [${cleanId}] cho model "${modelCode}". Dữ liệu đang được tự động đối chiếu lại!`);
  };

  // Handle user decision when there is a discrepancy between Priority 1 and Priority 2
  const handleResolveDiscrepancy = (discrepancy, chosenPropertyId, isPriority2) => {
    setAttributeMappings(prev => {
      const catId = String(discrepancy.cmsCategoryId).trim();
      const pimCode = String(discrepancy.pimAttributeCode).trim().toLowerCase();
      const existingIdx = prev.findIndex(a => 
        String(a.cmsCategoryId).trim() === catId && 
        String(a.pimAttributeCode).trim().toLowerCase() === pimCode
      );

      const originalP1Id = discrepancy.priority1?.cmsPropertyId 
        || (existingIdx !== -1 ? (prev[existingIdx].originalP1Id || prev[existingIdx].cmsPropertyId) : null);
      const originalP1Name = discrepancy.priority1?.cmsPropertyName 
        || (existingIdx !== -1 ? (prev[existingIdx].originalP1Name || prev[existingIdx].cmsPropertyName) : '');

      const updatedRule = {
        cmsCategoryId: catId,
        cmsCategoryName: discrepancy.cmsCategoryName || '',
        pimAttributeCode: discrepancy.pimAttributeCode,
        cmsPropertyId: String(chosenPropertyId).trim(),
        cmsPropertyName: isPriority2 ? (discrepancy.priority2?.cmsPropertyName || '') : (discrepancy.priority1?.cmsPropertyName || ''),
        pimMode: isPriority2 ? (discrepancy.priority2?.propertyType === 0 ? 'text' : 'tskt') : 'tskt',
        status: 'Confirmed',
        source: isPriority2 ? 'priority2_accepted' : 'priority1_accepted',
        originalP1Id: originalP1Id,
        originalP1Name: originalP1Name,
        note: isPriority2 
          ? `Người dùng đã duyệt áp dụng mã ${chosenPropertyId} theo Danh mục CMS thông minh (Ưu tiên 2)`
          : `Người dùng đã chọn giữ mã ${chosenPropertyId} theo File tham chiếu (Ưu tiên 1)`,
        updatedAt: new Date().toISOString()
      };

      if (existingIdx !== -1) {
        const next = [...prev];
        next[existingIdx] = { ...next[existingIdx], ...updatedRule };
        return next;
      } else {
        return [...prev, updatedRule];
      }
    });

    notify.success(
      `Đã áp dụng mã CMS ${chosenPropertyId} cho thuộc tính "${discrepancy.pimAttributeLabel || discrepancy.pimAttributeCode}" (${isPriority2 ? 'Ưu tiên 2: CMS thông minh' : 'Ưu tiên 1: File tham chiếu'})!`,
      'Cập nhật quy tắc thành công'
    );
  };

  // Bulk add auto-mapped rules from Priority 2 into attributeMappings
  const handleAddAutoMappedRules = (autoRules) => {
    if (!autoRules || autoRules.length === 0) return;
    setAttributeMappings(prev => {
      const map = new Map();
      prev.forEach(r => map.set(`${String(r.cmsCategoryId).trim()}___${String(r.pimAttributeCode).trim().toLowerCase()}`, r));
      
      const newItems = [];
      autoRules.forEach(ar => {
        const key = `${String(ar.cmsCategoryId).trim()}___${String(ar.pimAttributeCode).trim().toLowerCase()}`;
        if (!map.has(key)) {
          const rule = {
            cmsCategoryId: String(ar.cmsCategoryId).trim(),
            cmsCategoryName: ar.cmsCategoryName || '',
            pimAttributeCode: ar.pimAttributeCode,
            cmsPropertyId: String(ar.cmsPropertyId).trim(),
            cmsPropertyName: ar.cmsPropertyName || '',
            pimMode: ar.pimMode || (ar.propertyType === 0 ? 'text' : 'tskt'),
            status: 'Confirmed',
            source: 'smart_auto_map',
            note: 'Đã lưu và duyệt từ nhận diện thông minh (Ưu tiên 2)',
            updatedAt: new Date().toISOString()
          };
          map.set(key, rule);
          newItems.push(rule);
        }
      });
      return [...prev, ...newItems];
    });
    notify.success(`Đã lưu và duyệt thành công ${autoRules.length} thuộc tính thông minh vào bảng quy tắc chính thức (Ưu tiên 2)!`);
  };

  const hasMasterData = Boolean(masterFiles.cmsCatalog?.parsedData && masterFiles.pimOption?.parsedData);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', backgroundColor: 'var(--bg-primary)' }}>
      {/* Modern Professional Collapsible Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
        onLoadSample={handleLoadSampleAll}
        isSampleLoading={isLoading}
        pimFiles={pimFiles}
        pimProductData={pimProductData}
        transformationResult={transformationResult}
        masterFiles={masterFiles}
        onOpenMasterData={() => setActiveTab('masterData')}
      />

      {/* Main Workspace Column */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
        <Header
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onLoadSample={handleLoadSampleAll}
          isSampleLoading={isLoading}
          pimFiles={pimFiles}
          pimProductData={pimProductData}
          transformationResult={transformationResult}
          masterFiles={masterFiles}
          onOpenMasterData={() => setActiveTab('masterData')}
        />

        <main style={{ flex: 1, padding: '24px 0', overflowY: 'auto' }}>
          {activeTab === 'upload' && (
            <FileUploadTab
              masterFiles={masterFiles}
              pimFiles={pimFiles}
              pimProductData={pimProductData}
              onPimFilesLoaded={handlePimFilesLoaded}
              onRemovePimFile={handleRemovePimFile}
              onClearAllPimFiles={handleClearAllPimFiles}
              onAssignCategoryToFile={handleAssignCategoryToFile}
              onLoadSamplePimProduct={handleLoadSamplePimProduct}
              cmsCategories={masterFiles.cmsCatalog?.parsedData?.categories || []}
              isLoading={isLoading}
              onOpenMasterData={() => setActiveTab('masterData')}
              onProceedToMapping={() => setActiveTab('mapping')}
              onProceedToPreview={() => {
                executeTransformation();
                setActiveTab('preview');
              }}
              onSaveMasterDataset={handleSaveMasterDataset}
            />
          )}

          {activeTab === 'masterData' && (
            <MasterDataTab
              masterFiles={masterFiles}
              onUpdateMasterFile={handleUpdateMasterFile}
              onResetMasterFiles={handleResetMasterFiles}
              onSaveMasterDataset={handleSaveMasterDataset}
              onLoadSampleMasterData={loadSampleMasterData}
              isLoading={isLoading}
              onProceedToMapping={() => setActiveTab('mapping')}
              onProceedToUpload={() => setActiveTab('upload')}
            />
          )}

          {activeTab === 'mapping' && (
            <MappingRulesTab
              categoryMappings={categoryMappings}
              setCategoryMappings={setCategoryMappings}
              attributeMappings={attributeMappings}
              setAttributeMappings={setAttributeMappings}
              cmsCatalog={masterFiles.cmsCatalog?.parsedData}
              discrepancies={transformationResult?.discrepancies || []}
              autoMappedAttributes={transformationResult?.autoMappedAttributes || []}
              unmappedAttributes={transformationResult?.unmappedAttributes || []}
              onResolveDiscrepancy={handleResolveDiscrepancy}
              onAddAutoMappedRules={handleAddAutoMappedRules}
              onProceedToPreview={() => {
                executeTransformation();
                setActiveTab('preview');
              }}
            />
          )}

          {activeTab === 'preview' && (
            <PreviewTraceTab
              transformationResult={transformationResult}
              setTransformationResult={setTransformationResult}
              onSupplementCmsId={handleSupplementCmsId}
              userConfig={userConfig}
              onProceedToExport={() => setActiveTab('export')}
              onLoadSampleAll={handleLoadSampleAll}
              onGoToUpload={() => setActiveTab('upload')}
              onGoToMapping={() => setActiveTab('mapping')}
              onResolveDiscrepancy={handleResolveDiscrepancy}
              isLoading={isLoading}
            />
          )}

          {activeTab === 'export' && (
            <ExportTab
              transformationResult={transformationResult}
              userConfig={userConfig}
              setUserConfig={setUserConfig}
            />
          )}

          {activeTab === 'pimDecoder' && (
            <PimDecoderTab
              pimFiles={pimFiles}
              pimProductData={pimProductData}
              masterFiles={masterFiles}
              onLoadSampleMasterData={loadSampleMasterData}
            />
          )}
        </main>
      </div>
    </div>
  );
}
