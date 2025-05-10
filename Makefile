build:
	npm install
	npm run build

clean:
	rm -rf node_modules dist

publish:
	scp dist/* root@petey-tower:/mnt/user/appdata/server-site/spa
