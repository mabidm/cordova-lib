/*
 *
 * Copyright 2013 Anis Kadri
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 *
*/

var fs = require('fs')
  , path = require('path')
  , xcode = require('xcode')
  , osenv = require('osenv')
  , shell = require('shelljs')
  , et = require('elementtree')
  , ios = require(path.join(__dirname, '..', 'platforms', 'ios'))
  , plugin_loader = require('../util/plugin_loader')
  , test_dir = path.join(osenv.tmpdir(), 'test_plugman')
  , test_project_dir = path.join(test_dir, 'projects', 'ios-config-xml')
  , test_plugin_dir = path.join(test_dir, 'plugins', 'ChildBrowser')
  , xml_path     = path.join(test_dir, 'plugins', 'ChildBrowser', 'plugin.xml')
  , xml_text, plugin_et

  //, assetsDir = path.resolve(config.projectPath, 'www')
  , srcDir = path.resolve(test_project_dir, 'SampleApp/Plugins')
  , wwwDir = path.resolve(test_project_dir, 'www')
  , resDir = path.resolve(test_project_dir, 'SampleApp/Resources');

exports.setUp = function(callback) {
    shell.mkdir('-p', test_dir);
    
    // copy the ios test project to a temp directory
    shell.cp('-r', path.join(__dirname, 'projects'), test_dir);

    // copy the ios test plugin to a temp directory
    shell.cp('-r', path.join(__dirname, 'plugins'), test_dir);

    // parse the plugin.xml into an elementtree object
    xml_text   = fs.readFileSync(xml_path, 'utf-8')
    plugin_et  = new et.ElementTree(et.XML(xml_text));

    callback();
}

exports.tearDown = function(callback) {
    // remove the temp files (projects and plugins)
    shell.rm('-rf', test_dir);
    callback();
}

exports['should install webless plugin'] = function (test) {
    // setting up a DummyPlugin
    var pluginsPath = path.join(test_dir, 'plugins');
    var wwwPath = path.join(test_dir, 'projects', 'ios', 'www');
    var dummy_plugin_dir = path.join(test_dir, 'plugins', 'WeblessPlugin')
    var dummy_xml_path = path.join(test_dir, 'plugins', 'WeblessPlugin', 'plugin.xml')
    var dummy_plugin_et  = new et.ElementTree(et.XML(fs.readFileSync(dummy_xml_path, 'utf-8')));
    
// out var/folders/k5/p44x4yn122s_gk2s0p0c7rm00000gn/T/test_plugman/projects/ios/SampleApp/Plugins/

// test project dir var/folders/k5/p44x4yn122s_gk2s0p0c7rm00000gn/T/test_plugman/projects/ios

    ios.handlePlugin('install', test_project_dir, dummy_plugin_dir, dummy_plugin_et, { APP_ID: 12345 });
    plugin_loader.handlePrepare(test_project_dir, pluginsPath, wwwPath, 'ios');
    
    var huh =  path.join(test_project_dir, 'SampleApp');
    console.log(huh);
    console.log('contents ' + fs.readdirSync(huh));
    
    test.done();
}

exports['should move the js file'] = function (test) {
    // run the platform-specific function
    var wwwPath = path.join(test_dir, 'projects', 'ios', 'www');
    var jsPath = path.join(test_dir, 'projects', 'ios-config-xml', 'www', 'childbrowser.js');
    
    ios.handlePlugin('install', test_project_dir, test_plugin_dir, plugin_et, { APP_ID: 12345 });
    plugin_loader.handlePrepare(test_project_dir, pluginsPath, wwwPath, 'ios');
    
    test.ok(fs.existsSync(jsPath));
    test.ok(fs.statSync(jsPath).isFile());
    test.done();
}

exports['should move the source files'] = function (test) {
    // run the platform-specific function
    ios.handlePlugin('install', test_project_dir, test_plugin_dir, plugin_et, { APP_ID: 12345 });

    test.ok(fs.existsSync(srcDir + '/ChildBrowserCommand.m'))
    test.ok(fs.existsSync(srcDir + '/ChildBrowserViewController.m'))
    test.ok(fs.existsSync(srcDir + '/preserveDirs/PreserveDirsTest.m'))
    test.ok(fs.existsSync(srcDir + '/targetDir/TargetDirTest.m'))
    test.done();
}

exports['should move the header files'] = function (test) {
    // run the platform-specific function
    ios.handlePlugin('install', test_project_dir, test_plugin_dir, plugin_et, { APP_ID: 12345 });

    test.ok(fs.statSync(srcDir + '/ChildBrowserCommand.h'));
    test.ok(fs.statSync(srcDir + '/ChildBrowserViewController.h'));
    test.ok(fs.statSync(srcDir + '/preserveDirs/PreserveDirsTest.h'));
    test.ok(fs.statSync(srcDir + '/targetDir/TargetDirTest.h'));
    test.done();
}

exports['should move the xib file'] = function (test) {
    // run the platform-specific function
    ios.handlePlugin('install', test_project_dir, test_plugin_dir, plugin_et, { APP_ID: 12345 });

    test.ok(fs.statSync(resDir + '/ChildBrowserViewController.xib'));
    test.done();
}

exports['should move the bundle'] = function (test) {
    // run the platform-specific function
    ios.handlePlugin('install', test_project_dir, test_plugin_dir, plugin_et, { APP_ID: 12345 });

    var bundle = fs.statSync(resDir + '/ChildBrowser.bundle');

    test.ok(bundle.isDirectory());
    test.done();
}

exports['should edit config.xml'] = function (test) {
    // setting up WebNotification (with config.xml) 
    var dummy_plugin_dir = path.join(test_dir, 'plugins', 'WebNotifications')
    var dummy_xml_path = path.join(test_dir, 'plugins', 'WebNotifications', 'plugin.xml')
    
    // overriding some params
    var dummy_plugin_et  = new et.ElementTree(et.XML(fs.readFileSync(dummy_xml_path, 'utf-8')));

    // run the platform-specific function
    ios.handlePlugin('install', test_project_dir, dummy_plugin_dir, dummy_plugin_et);
    
    var configXmlPath = path.join(test_project_dir, 'SampleApp', 'config.xml');
    var pluginsTxt = fs.readFileSync(configXmlPath, 'utf-8'),
        pluginsDoc = new et.ElementTree(et.XML(pluginsTxt)),
        expected = 'plugins/plugin[@name="WebNotifications"]' +
                    '[@value="WebNotifications"]';

    test.ok(pluginsDoc.find(expected));
    test.equal(pluginsDoc.findall("access").length, 3, "/access");
    test.equal(pluginsDoc.findall("access")[1].attrib["origin"], "build.phonegap.com")
    test.equal(pluginsDoc.findall("access")[2].attrib["origin"], "s3.amazonaws.com")
    test.done();
}

exports['should edit config.xml even when using old <plugins-plist> approach'] = function (test) {
    // setting up PGSQLitePlugin (with config.xml) 
    var dummy_plugin_dir = path.join(test_dir, 'plugins', 'ChildBrowser')
    var dummy_xml_path = path.join(dummy_plugin_dir, 'plugin-old.xml')
    
    // overriding some params
    var dummy_plugin_et  = new et.ElementTree(et.XML(fs.readFileSync(dummy_xml_path, 'utf-8')));

    // run the platform-specific function
    ios.handlePlugin('install', test_project_dir, dummy_plugin_dir, dummy_plugin_et, { APP_ID: 12345 });
    
    var configXmlPath = path.join(test_project_dir, 'SampleApp', 'config.xml');
    var pluginsTxt = fs.readFileSync(configXmlPath, 'utf-8'),
        pluginsDoc = new et.ElementTree(et.XML(pluginsTxt)),
        expected = 'plugins/plugin[@name="com.phonegap.plugins.childbrowser"]' +
                    '[@value="ChildBrowserCommand"]';

    test.ok(pluginsDoc.find(expected));
    test.equal(pluginsDoc.findall("access").length, 3, "/access");
    test.equal(pluginsDoc.findall("access")[1].attrib["origin"], "build.phonegap.com")
    test.equal(pluginsDoc.findall("access")[2].attrib["origin"], "12345.s3.amazonaws.com")

    test.done();
}

exports['should edit the pbxproj file'] = function (test) {
    // run the platform-specific function
    ios.handlePlugin('install', test_project_dir, test_plugin_dir, plugin_et, { APP_ID: 12345 });

    var projPath = test_project_dir + '/SampleApp.xcodeproj/project.pbxproj';

    obj = xcode.project(projPath).parseSync();
    var fileRefSection = obj.hash.project.objects['PBXFileReference'],
        fileRefLength = Object.keys(fileRefSection).length,
        EXPECTED_TOTAL_REFERENCES = 96; // magic number ahoy!

    test.equal(fileRefLength, EXPECTED_TOTAL_REFERENCES);
    test.done();
}

exports['should add the framework references to the pbxproj file'] = function (test) {
    // run the platform-specific function
    ios.handlePlugin('install', test_project_dir, test_plugin_dir, plugin_et, { APP_ID: 12345 });
    var projPath = test_project_dir + '/SampleApp.xcodeproj/project.pbxproj',
        projContents = fs.readFileSync(projPath, 'utf8'),
        projLines = projContents.split("\n"),
		weak_linked = "settings = {ATTRIBUTES = (Weak, ); };",
        references;

    references = projLines.filter(function (line) {
        return !!(line.match("libsqlite3.dylib"));
    })

    // should be four libsqlite3 reference lines added
    // pretty low-rent test eh
    test.equal(references.length, 4);
    test.ok(references[0].indexOf(weak_linked) == -1);
    test.done();
}

exports['should add the framework references with weak option to the pbxproj file'] = function (test) {
    // run the platform-specific function
    ios.handlePlugin('install', test_project_dir, test_plugin_dir, plugin_et, { APP_ID: 12345 });
    var projPath = test_project_dir + '/SampleApp.xcodeproj/project.pbxproj',
        projContents = fs.readFileSync(projPath, 'utf8'),
        projLines = projContents.split("\n"),
		weak_linked = "settings = {ATTRIBUTES = (Weak, ); };",
        references;

    weak_references = projLines.filter(function (line) {
        return !!(line.match("social.framework"));
    })

    non_weak_references = projLines.filter(function (line) {
        return !!(line.match("music.framework"));
    })

    // should be four libsqlite3 reference lines added
    // pretty low-rent test eh
    test.equal(weak_references.length, 4);
    test.ok(weak_references[0].indexOf(weak_linked) != -1);
    
    test.equal(non_weak_references.length, 4);
    test.ok(non_weak_references[0].indexOf(weak_linked) == -1);
    test.done();
}

exports['should not install a plugin that is already installed'] = function (test) {
    ios.handlePlugin('install', test_project_dir, test_plugin_dir, plugin_et, { APP_ID: 12345 });

    test.throws(function(){ios.handlePlugin('install', test_project_dir, test_plugin_dir, plugin_et); }, 
                /already installed/
               );
    test.done();
}

exports['should skip collision check when installation is forced'] = function (test) {
    ios.handlePlugin('install', test_project_dir, test_plugin_dir, plugin_et, { APP_ID: 12345 });
    // deleting files because only presence in config.xml determines installation
    shell.rm('-rf', srcDir + '/*');
    shell.rm('-rf', resDir + '/*');
    shell.rm('-rf', wwwDir + '/*');
    test.doesNotThrow(function(){ios.handlePlugin('force-install', test_project_dir, test_plugin_dir, plugin_et); }, 
                /already installed/
               );
    test.done();
}

